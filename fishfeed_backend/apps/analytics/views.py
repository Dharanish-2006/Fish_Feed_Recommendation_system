from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from apps.users.permissions import IsAdminUser, IsFarmerOrAdmin
from apps.users.models import User
from apps.feeds.models import FeedProduct
from apps.farms.models import Farm, FishStock, FeedingHistory
from apps.recommendations.models import Recommendation, RecommendationResult


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        last_30 = now - timedelta(days=30)

        total_farmers = User.objects.filter(role='farmer', is_active=True).count()
        total_suppliers = User.objects.filter(role='supplier', is_active=True).count()
        total_feeds = FeedProduct.objects.filter(is_available=True).count()
        total_species = __import__('apps.species.models', fromlist=['FishSpecies']).FishSpecies.objects.filter(is_active=True).count()

        rec_stats = Recommendation.objects.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            avg_match=Avg('results__match_percentage'),
        )

        new_farmers_30d = User.objects.filter(role='farmer', date_joined__gte=last_30).count()
        new_recs_30d = Recommendation.objects.filter(created_at__gte=last_30, status='completed').count()

        top_feeds = (
            RecommendationResult.objects
            .values('feed__name', 'feed__id')
            .annotate(times_recommended=Count('id'), avg_score=Avg('match_percentage'))
            .order_by('-times_recommended')[:5]
        )

        return Response({
            'totals': {
                'farmers': total_farmers,
                'suppliers': total_suppliers,
                'feed_products': total_feeds,
                'fish_species': total_species,
            },
            'recommendations': {
                'total': rec_stats['total'],
                'completed': rec_stats['completed'],
                'avg_match_percentage': round(rec_stats['avg_match'] or 0, 1),
            },
            'last_30_days': {
                'new_farmers': new_farmers_30d,
                'recommendations_generated': new_recs_30d,
            },
            'top_recommended_feeds': list(top_feeds),
        })


class FarmerDashboardView(APIView):
    permission_classes = [IsFarmerOrAdmin]

    def get(self, request):
        farmer = request.user
        farms = Farm.objects.filter(farmer=farmer, is_active=True)
        stocks = FishStock.objects.filter(farm__farmer=farmer, is_active=True)
        recent_recs = Recommendation.objects.filter(
            farmer=farmer, status='completed'
        ).prefetch_related('results__feed').order_by('-created_at')[:5]

        recent_feeding = FeedingHistory.objects.filter(
            fish_stock__farm__farmer=farmer
        ).select_related('feed', 'fish_stock__species').order_by('-feeding_date')[:10]

        return Response({
            'farms_count': farms.count(),
            'active_stocks': stocks.count(),
            'total_fish': sum(s.quantity for s in stocks),
            'recent_recommendations': [
                {
                    'id': r.id,
                    'fish_stock': str(r.fish_stock),
                    'best_feed': r.results.first().feed.name if r.results.exists() else None,
                    'match_percentage': r.results.first().match_percentage if r.results.exists() else None,
                    'created_at': r.created_at,
                }
                for r in recent_recs
            ],
            'recent_feeding': [
                {
                    'date': f.feeding_date,
                    'feed': f.feed.name if f.feed else 'Unknown',
                    'species': f.fish_stock.species.name,
                    'quantity_kg': f.quantity_kg,
                }
                for f in recent_feeding
            ],
        })


class SupplierDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ('supplier', 'admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()

        feeds = FeedProduct.objects.filter(supplier=request.user)
        low_stock = feeds.filter(stock_quantity_kg__lt=50)

        top_feeds = (
            RecommendationResult.objects
            .filter(feed__supplier=request.user)
            .values('feed__name', 'feed__id')
            .annotate(times=Count('id'), avg_score=Avg('match_percentage'))
            .order_by('-times')[:5]
        )

        return Response({
            'total_products': feeds.count(),
            'available_products': feeds.filter(is_available=True).count(),
            'low_stock_products': low_stock.count(),
            'low_stock_list': [{'id': f.id, 'name': f.name, 'stock_kg': f.stock_quantity_kg} for f in low_stock],
            'top_recommended_feeds': list(top_feeds),
        })
