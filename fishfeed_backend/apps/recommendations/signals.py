from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Recommendation


@receiver(post_save, sender=Recommendation)
def notify_recommendation_ready(sender, instance, created, **kwargs):
    if not created and instance.status == 'completed':
        from apps.notifications.models import Notification
        from apps.notifications.tasks import send_email_notification

        Notification.objects.get_or_create(
            user=instance.farmer,
            notification_type='recommendation_ready',
            metadata={'recommendation_id': instance.id},
            defaults={
                'title': 'Feed Recommendation Ready',
                'message': (
                    f'Your feed recommendation for {instance.fish_stock.species.name} '
                    f'at {instance.fish_stock.farm.name} is ready. '
                    f'Predicted group: {instance.predicted_feed_group.replace("_", " ").title()}.'
                ),
            }
        )

        send_email_notification.delay(
            instance.farmer.id,
            'Your Feed Recommendation Is Ready',
            f'Hello {instance.farmer.full_name},\n\n'
            f'A new feed recommendation for your {instance.fish_stock.species.name} '
            f'at "{instance.fish_stock.farm.name}" is ready.\n\n'
            f'Log in to view the best feed matches and their scores.\n\n'
            f'— The Fish Feed Team'
        )
