from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.postgres.search import SearchVector
from .models import FishSpecies


@receiver(post_save, sender=FishSpecies)
def update_search_vector(sender, instance, **kwargs):
    """Keep the PostgreSQL full-text search vector up to date."""
    FishSpecies.objects.filter(pk=instance.pk).update(
        search_vector=(
            SearchVector('name', weight='A') +
            SearchVector('scientific_name', weight='B') +
            SearchVector('habitat', weight='C') +
            SearchVector('description', weight='D')
        )
    )
