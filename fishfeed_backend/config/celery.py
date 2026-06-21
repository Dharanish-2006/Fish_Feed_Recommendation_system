import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('fishfeed')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'recalculate-recommendations-nightly': {
        'task': 'apps.recommendations.tasks.recalculate_all_recommendations',
        'schedule': crontab(hour=2, minute=0),
    },
    'send-daily-digest': {
        'task': 'apps.notifications.tasks.send_daily_digest',
        'schedule': crontab(hour=8, minute=0),
    },
    'weekly-analytics-report': {
        'task': 'apps.analytics.tasks.generate_weekly_report',
        'schedule': crontab(hour=9, minute=0, day_of_week=1),
    },
}
