from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_email_notification(user_id: int, subject: str, message: str):
    """Send an email notification to a user."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info('Email sent to %s: %s', user.email, subject)
    except Exception as e:
        logger.error('Failed to send email to user %d: %s', user_id, e)


@shared_task
def send_daily_digest():
    """Send a daily digest email to all active farmers."""
    from django.contrib.auth import get_user_model
    from apps.recommendations.models import Recommendation
    from datetime import date, timedelta

    User = get_user_model()
    farmers = User.objects.filter(role='farmer', is_active=True)
    yesterday = date.today() - timedelta(days=1)

    for farmer in farmers:
        recs = Recommendation.objects.filter(
            farmer=farmer,
            created_at__date=yesterday,
            status='completed'
        ).count()

        if recs:
            send_email_notification.delay(
                farmer.id,
                'Your Fish Feed Daily Report',
                f'Hello {farmer.full_name},\n\n'
                f'You received {recs} new feed recommendation(s) yesterday.\n'
                f'Log in to view them.\n\n'
                f'— The Fish Feed Team'
            )


@shared_task
def notify_low_stock(feed_id: int):
    """Notify a supplier when their feed stock drops below threshold."""
    from apps.feeds.models import FeedProduct
    from apps.notifications.models import Notification

    try:
        feed = FeedProduct.objects.select_related('supplier').get(id=feed_id)
        Notification.objects.create(
            user=feed.supplier,
            notification_type='low_stock',
            title=f'Low Stock: {feed.name}',
            message=f'Your feed "{feed.name}" has only {feed.stock_quantity_kg}kg remaining.',
            metadata={'feed_id': feed.id, 'stock_quantity_kg': feed.stock_quantity_kg}
        )
        send_email_notification.delay(
            feed.supplier.id,
            f'Low Stock Alert: {feed.name}',
            f'Your feed product "{feed.name}" is running low ({feed.stock_quantity_kg}kg left).\n'
            f'Please replenish your inventory.'
        )
    except Exception as e:
        logger.error('Low stock notification failed for feed %d: %s', feed_id, e)
