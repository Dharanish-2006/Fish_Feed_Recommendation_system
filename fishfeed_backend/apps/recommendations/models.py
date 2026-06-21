from django.db import models
from django.conf import settings
from apps.farms.models import FishStock
from apps.feeds.models import FeedProduct


class Recommendation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recommendations'
    )
    fish_stock = models.ForeignKey(
        FishStock,
        on_delete=models.CASCADE,
        related_name='recommendations'
    )

    # Input snapshot (JSON stored)
    input_parameters = models.JSONField()

    # ML outputs
    predicted_feed_group = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'recommendations'
        ordering = ['-created_at']

    def __str__(self):
        return f'Recommendation for {self.fish_stock} ({self.status})'


class RecommendationResult(models.Model):
    """Individual feed result within a recommendation."""
    recommendation = models.ForeignKey(
        Recommendation,
        on_delete=models.CASCADE,
        related_name='results'
    )
    feed = models.ForeignKey(
        FeedProduct,
        on_delete=models.SET_NULL,
        null=True,
        related_name='recommendation_results'
    )
    rank = models.PositiveIntegerField(default=1)
    match_percentage = models.FloatField()
    nutritional_score = models.FloatField()
    group_score = models.FloatField()
    explanation = models.TextField(blank=True)
    composition_snapshot = models.JSONField(default=dict)

    class Meta:
        db_table = 'recommendation_results'
        ordering = ['rank']

    def __str__(self):
        return f'Rank {self.rank}: {self.feed.name if self.feed else "N/A"} ({self.match_percentage}%)'
