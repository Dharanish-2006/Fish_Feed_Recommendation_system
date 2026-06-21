from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import FeedProduct, FeedInventoryLog
from .serializers import (
    FeedProductSerializer, FeedProductListSerializer,
    FeedInventoryLogSerializer, UpdateInventorySerializer
)
from apps.users.permissions import IsSupplierOrAdmin, IsSupplierUser


class FeedProductListView(generics.ListAPIView):
    """List all available feed products (all authenticated users)."""
    serializer_class = FeedProductListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['feed_form', 'is_available', 'supplier']
    search_fields = ['name', 'brand', 'description']
    ordering_fields = ['price_per_kg', 'protein_percentage', 'created_at']

    def get_queryset(self):
        return FeedProduct.objects.filter(is_available=True).select_related('supplier')


class FeedProductDetailView(generics.RetrieveAPIView):
    serializer_class = FeedProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = FeedProduct.objects.all()


class SupplierFeedListView(generics.ListCreateAPIView):
    """Supplier: view own feeds or create a new one."""
    permission_classes = [IsSupplierOrAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FeedProductSerializer
        return FeedProductListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return FeedProduct.objects.all()
        return FeedProduct.objects.filter(supplier=user)

    def perform_create(self, serializer):
        serializer.save(supplier=self.request.user)


class SupplierFeedDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Supplier: manage a specific feed product."""
    serializer_class = FeedProductSerializer
    permission_classes = [IsSupplierOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return FeedProduct.objects.all()
        return FeedProduct.objects.filter(supplier=user)


class UpdateInventoryView(APIView):
    """Supplier: add/remove stock from a feed product."""
    permission_classes = [IsSupplierOrAdmin]

    def post(self, request, pk):
        feed = get_object_or_404(FeedProduct, pk=pk, supplier=request.user)
        serializer = UpdateInventorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        qty = serializer.validated_data['quantity_kg']

        if action == 'add':
            feed.stock_quantity_kg += qty
        elif action == 'sell':
            if qty > feed.stock_quantity_kg:
                return Response({'error': 'Insufficient stock.'}, status=status.HTTP_400_BAD_REQUEST)
            feed.stock_quantity_kg -= qty
        elif action == 'adjust':
            feed.stock_quantity_kg = qty

        feed.save()

        log = FeedInventoryLog.objects.create(
            feed=feed,
            action=action,
            quantity_kg=qty,
            notes=serializer.validated_data.get('notes', '')
        )

        return Response({
            'message': f'Inventory updated. Current stock: {feed.stock_quantity_kg}kg',
            'log': FeedInventoryLogSerializer(log).data
        })


class FeedInventoryLogView(generics.ListAPIView):
    """Supplier: view inventory history for a feed."""
    serializer_class = FeedInventoryLogSerializer
    permission_classes = [IsSupplierOrAdmin]

    def get_queryset(self):
        return FeedInventoryLog.objects.filter(
            feed__supplier=self.request.user,
            feed_id=self.kwargs['pk']
        )
