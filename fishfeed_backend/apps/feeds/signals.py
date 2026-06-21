from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import FeedProduct

LOW_STOCK_THRESHOLD_KG = 50.0


@receiver(post_save, sender=FeedProduct)
def check_low_stock(sender, instance, **kwargs):
    """Fire a low-stock notification task when stock drops below threshold."""
    if instance.stock_quantity_kg < LOW_STOCK_THRESHOLD_KG and instance.is_available:
        from apps.notifications.tasks import notify_low_stock
        notify_low_stock.delay(instance.id)
