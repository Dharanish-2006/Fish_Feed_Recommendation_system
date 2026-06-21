from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task
def generate_weekly_report():
    """Generate and email a weekly analytics report to admins."""
    from django.contrib.auth import get_user_model
    from apps.recommendations.models import Recommendation
    from apps.notifications.tasks import send_email_notification
    from django.db.models import Count, Avg
    from datetime import date, timedelta

    User = get_user_model()
    admins = User.objects.filter(role='admin', is_active=True)
    last_week = date.today() - timedelta(days=7)

    stats = Recommendation.objects.filter(
        created_at__date__gte=last_week,
        status='completed'
    ).aggregate(total=Count('id'), avg_match=Avg('results__match_percentage'))

    for admin in admins:
        send_email_notification.delay(
            admin.id,
            'Weekly Fish Feed Analytics Report',
            f'Weekly Summary:\n\n'
            f'Recommendations generated: {stats["total"]}\n'
            f'Average match score: {round(stats["avg_match"] or 0, 1)}%\n\n'
            f'Log in to the admin dashboard for detailed analytics.'
        )
    logger.info('Weekly report sent to %d admin(s).', admins.count())
