from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Recommendation
from .serializers import RecommendationSerializer, GenerateRecommendationSerializer
from .service import generate_recommendation
from .tasks import async_generate_recommendation
from apps.users.permissions import IsFarmerOrAdmin, IsAdminUser


class GenerateRecommendationView(APIView):
    permission_classes = [IsFarmerOrAdmin]

    def post(self, request):
        serializer = GenerateRecommendationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        fish_stock_id = serializer.validated_data['fish_stock_id']

        try:
            rec = generate_recommendation(fish_stock_id, request.user)
            return Response(
                RecommendationSerializer(rec).data,
                status=status.HTTP_201_CREATED
            )
        except FishStock.DoesNotExist:
            return Response({'error': 'Fish stock not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RecommendationListView(generics.ListAPIView):
    """Farmer: list own recommendations."""
    serializer_class = RecommendationSerializer
    permission_classes = [IsFarmerOrAdmin]
    filterset_fields = ['status', 'fish_stock']
    ordering_fields = ['created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Recommendation.objects.prefetch_related('results__feed__supplier').all()
        return Recommendation.objects.filter(farmer=user).prefetch_related('results__feed__supplier')


class RecommendationDetailView(generics.RetrieveAPIView):
    """Farmer: view a specific recommendation."""
    serializer_class = RecommendationSerializer
    permission_classes = [IsFarmerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Recommendation.objects.all()
        return Recommendation.objects.filter(farmer=user)


class LatestRecommendationForStockView(APIView):
    """Get the latest completed recommendation for a specific fish stock."""
    permission_classes = [IsFarmerOrAdmin]

    def get(self, request, stock_pk):
        try:
            rec = Recommendation.objects.filter(
                farmer=request.user,
                fish_stock_id=stock_pk,
                status='completed'
            ).prefetch_related('results__feed__supplier').latest('created_at')
            return Response(RecommendationSerializer(rec).data)
        except Recommendation.DoesNotExist:
            return Response({'detail': 'No recommendation found for this stock.'}, status=404)


from apps.farms.models import FishStock
