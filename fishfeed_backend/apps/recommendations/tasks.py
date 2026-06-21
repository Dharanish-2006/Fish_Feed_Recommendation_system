from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def async_generate_recommendation(self, fish_stock_id: int, farmer_id: int):
    """Async task to generate a recommendation."""
    from django.contrib.auth import get_user_model
    from .service import generate_recommendation

    User = get_user_model()
    try:
        farmer = User.objects.get(id=farmer_id)
        generate_recommendation(fish_stock_id, farmer)
        logger.info('Recommendation generated for stock %d', fish_stock_id)
    except Exception as exc:
        logger.error('Recommendation task failed: %s', exc)
        raise self.retry(exc=exc)


@shared_task
def recalculate_all_recommendations():
    """Nightly task: recalculate recommendations for all active farmers."""
    from django.contrib.auth import get_user_model
    from .service import recalculate_recommendations_for_farmer

    User = get_user_model()
    farmers = User.objects.filter(role='farmer', is_active=True)
    for farmer in farmers:
        try:
            recalculate_recommendations_for_farmer(farmer.id)
        except Exception as e:
            logger.error('Failed nightly recalc for farmer %d: %s', farmer.id, e)

    logger.info('Nightly recommendation recalculation complete for %d farmers.', farmers.count())
