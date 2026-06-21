"""
Recommendation service: fetches data from DB and calls the ML engine.
"""
import logging
from django.db import transaction
from apps.farms.models import FishStock
from apps.feeds.models import FeedProduct
from .models import Recommendation, RecommendationResult
from ml.engine import recommend_feeds

logger = logging.getLogger(__name__)


def _serialize_stock_for_engine(stock: FishStock) -> dict:
    """Build the dict that the ML engine expects."""
    species = stock.species
    return {
        'growth_stage': stock.growth_stage,
        'water_type': stock.water_type,
        'water_temperature': stock.water_temperature,
        'water_ph': stock.water_ph,
        'dissolved_oxygen': stock.dissolved_oxygen,
        'water_condition': stock.water_condition,
        'average_weight_grams': stock.average_weight_grams,
        'min_protein_req': species.min_protein_requirement,
        'max_protein_req': species.max_protein_requirement,
        'min_fat_req': species.min_fat_requirement,
        'max_fat_req': species.max_fat_requirement,
        'nutritional_requirements': species.get_nutritional_requirements(),
    }


def _get_available_feeds(stock: FishStock) -> list[dict]:
    """Get all available feeds, preferring those tagged for this species."""
    feeds = FeedProduct.objects.filter(is_available=True, stock_quantity_kg__gt=0) \
        .select_related('supplier')

    result = []
    for feed in feeds:
        result.append({
            'id': feed.id,
            'name': feed.name,
            'brand': feed.brand,
            'supplier_name': feed.supplier.full_name,
            'price_per_kg': float(feed.price_per_kg),
            'currency': feed.currency,
            'is_available': feed.is_available,
            'stock_quantity_kg': feed.stock_quantity_kg,
            'composition': feed.get_composition(),
        })
    return result


@transaction.atomic
def generate_recommendation(fish_stock_id: int, farmer) -> Recommendation:
    """
    Generate a new recommendation for a fish stock.
    Creates Recommendation + RecommendationResult rows.
    """
    stock = FishStock.objects.select_related('species', 'farm').get(
        id=fish_stock_id,
        farm__farmer=farmer,
        is_active=True
    )

    fish_data = _serialize_stock_for_engine(stock)
    feeds = _get_available_feeds(stock)

    rec = Recommendation.objects.create(
        farmer=farmer,
        fish_stock=stock,
        input_parameters=fish_data,
        status='pending',
    )

    try:
        results = recommend_feeds(fish_data, feeds, top_n=5)
        rec.predicted_feed_group = results[0]['predicted_feed_group'] if results else ''
        rec.status = 'completed'
        rec.save()

        for rank, item in enumerate(results, start=1):
            RecommendationResult.objects.create(
                recommendation=rec,
                feed_id=item['feed_id'],
                rank=rank,
                match_percentage=item['match_percentage'],
                nutritional_score=item['nutritional_score'],
                group_score=item['group_score'],
                explanation=item['explanation'],
                composition_snapshot=item['composition'],
            )

    except Exception as e:
        rec.status = 'failed'
        rec.error_message = str(e)
        rec.save()
        logger.error('Recommendation failed for stock %d: %s', fish_stock_id, e)
        raise

    return rec


def recalculate_recommendations_for_farmer(farmer_id: int):
    """Called by Celery task to refresh recommendations for a farmer."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    farmer = User.objects.get(id=farmer_id)

    stocks = FishStock.objects.filter(farm__farmer=farmer, is_active=True)
    for stock in stocks:
        try:
            generate_recommendation(stock.id, farmer)
        except Exception as e:
            logger.error('Failed to recalculate for stock %d: %s', stock.id, e)
