"""
Management command to train (or retrain) the LDA recommendation model.
Run: python manage.py train_ml_model
"""
from django.core.management.base import BaseCommand
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Train and save the LDA feed recommendation model.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force retrain even if a model already exists.',
        )

    def handle(self, *args, **options):
        from ml.engine import FeedLDAClassifier, LDA_MODEL_PATH

        if LDA_MODEL_PATH.exists() and not options['force']:
            self.stdout.write(self.style.WARNING(
                f'Model already exists at {LDA_MODEL_PATH}. Use --force to retrain.'
            ))
            return

        self.stdout.write('Training LDA recommendation model...')
        clf = FeedLDAClassifier()
        clf.train()
        clf.save()
        self.stdout.write(self.style.SUCCESS(
            f'Model trained and saved to {LDA_MODEL_PATH}'
        ))
