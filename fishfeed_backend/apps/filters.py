"""
Centralized filtersets using django-filter.
Each app imports its own filterset from here.
"""
import django_filters
from apps.species.models import FishSpecies
from apps.feeds.models import FeedProduct
from apps.farms.models import FishStock, FeedingHistory
from apps.recommendations.models import Recommendation


class FishSpeciesFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr='icontains')
    water_type = django_filters.ChoiceFilter(choices=FishSpecies.WATER_TYPE_CHOICES)
    growth_stage = django_filters.ChoiceFilter(choices=FishSpecies.GROWTH_STAGE_CHOICES)
    min_protein = django_filters.NumberFilter(
        field_name='min_protein_requirement', lookup_expr='lte'
    )
    max_protein = django_filters.NumberFilter(
        field_name='max_protein_requirement', lookup_expr='gte'
    )

    class Meta:
        model = FishSpecies
        fields = ['water_type', 'growth_stage', 'is_active']


class FeedProductFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr='icontains')
    min_protein = django_filters.NumberFilter(
        field_name='protein_percentage', lookup_expr='gte'
    )
    max_protein = django_filters.NumberFilter(
        field_name='protein_percentage', lookup_expr='lte'
    )
    min_price = django_filters.NumberFilter(
        field_name='price_per_kg', lookup_expr='gte'
    )
    max_price = django_filters.NumberFilter(
        field_name='price_per_kg', lookup_expr='lte'
    )
    feed_form = django_filters.ChoiceFilter(choices=FeedProduct.FEED_FORM_CHOICES)
    species = django_filters.ModelMultipleChoiceFilter(
        field_name='suitable_species',
        queryset=FishSpecies.objects.all()
    )

    class Meta:
        model = FeedProduct
        fields = ['feed_form', 'is_available', 'supplier']


class FishStockFilter(django_filters.FilterSet):
    species = django_filters.ModelChoiceFilter(queryset=FishSpecies.objects.all())
    growth_stage = django_filters.ChoiceFilter(choices=FishSpecies.GROWTH_STAGE_CHOICES)
    water_type = django_filters.ChoiceFilter(choices=FishSpecies.WATER_TYPE_CHOICES)

    class Meta:
        model = FishStock
        fields = ['species', 'growth_stage', 'water_type', 'is_active']


class FeedingHistoryFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name='feeding_date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='feeding_date', lookup_expr='lte')

    class Meta:
        model = FeedingHistory
        fields = ['fish_stock', 'feed', 'feeding_date']


class RecommendationFilter(django_filters.FilterSet):
    created_from = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_to = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    species = django_filters.CharFilter(field_name='fish_stock__species__name', lookup_expr='icontains')

    class Meta:
        model = Recommendation
        fields = ['status', 'fish_stock', 'predicted_feed_group']
