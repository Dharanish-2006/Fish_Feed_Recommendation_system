from rest_framework import generics, permissions
from .models import Farm, FishStock, FeedingHistory
from .serializers import FarmSerializer, FishStockSerializer, FeedingHistorySerializer
from apps.users.permissions import IsFarmerOrAdmin


class FarmListCreateView(generics.ListCreateAPIView):
    serializer_class = FarmSerializer
    permission_classes = [IsFarmerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Farm.objects.all().select_related('farmer')
        return Farm.objects.filter(farmer=user, is_active=True)

    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user)


class FarmDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FarmSerializer
    permission_classes = [IsFarmerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Farm.objects.all()
        return Farm.objects.filter(farmer=user)


class FishStockListCreateView(generics.ListCreateAPIView):
    serializer_class = FishStockSerializer
    permission_classes = [IsFarmerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return FishStock.objects.filter(farm_id=self.kwargs['farm_pk'])
        return FishStock.objects.filter(farm__farmer=user, farm_id=self.kwargs['farm_pk'], is_active=True)


class FishStockDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FishStockSerializer
    permission_classes = [IsFarmerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return FishStock.objects.all()
        return FishStock.objects.filter(farm__farmer=user)


class FeedingHistoryListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedingHistorySerializer
    permission_classes = [IsFarmerOrAdmin]
    filterset_fields = ['fish_stock', 'feed', 'feeding_date']
    ordering_fields = ['feeding_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return FeedingHistory.objects.all()
        return FeedingHistory.objects.filter(fish_stock__farm__farmer=user)
