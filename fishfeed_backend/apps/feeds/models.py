from django.db import models
from django.conf import settings
from apps.species.models import FishSpecies


class FeedProduct(models.Model):
    FEED_FORM_CHOICES = [
        ('pellet', 'Pellet'),
        ('crumble', 'Crumble'),
        ('powder', 'Powder'),
        ('flake', 'Flake'),
        ('extruded', 'Extruded'),
    ]

    supplier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feed_products',
        limit_choices_to={'role': 'supplier'}
    )
    name = models.CharField(max_length=255)
    brand = models.CharField(max_length=200, blank=True)
    feed_form = models.CharField(max_length=20, choices=FEED_FORM_CHOICES, default='pellet')
    image = models.ImageField(upload_to='feeds/', blank=True, null=True)
    description = models.TextField(blank=True)

    protein_percentage = models.FloatField()
    fat_percentage = models.FloatField()
    fiber_percentage = models.FloatField(default=0.0)
    moisture_percentage = models.FloatField(default=0.0)
    ash_percentage = models.FloatField(default=0.0)
    energy_kcal_per_kg = models.FloatField(default=0.0)

    suitable_species = models.ManyToManyField(FishSpecies, blank=True, related_name='compatible_feeds')

    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=5, default='USD')

    is_available = models.BooleanField(default=True)
    stock_quantity_kg = models.FloatField(default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'feed_products'
        verbose_name = 'Feed Product'
        verbose_name_plural = 'Feed Products'

    def __str__(self):
        return f'{self.name} by {self.supplier.full_name}'

    def get_composition(self):
        return {
            'protein': self.protein_percentage,
            'fat': self.fat_percentage,
            'fiber': self.fiber_percentage,
            'moisture': self.moisture_percentage,
            'ash': self.ash_percentage,
            'energy_kcal_per_kg': self.energy_kcal_per_kg,
        }


class FeedInventoryLog(models.Model):
    ACTION_CHOICES = [
        ('add', 'Stock Added'),
        ('sell', 'Stock Sold'),
        ('adjust', 'Manual Adjustment'),
    ]

    feed = models.ForeignKey(FeedProduct, on_delete=models.CASCADE, related_name='inventory_logs')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    quantity_kg = models.FloatField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feed_inventory_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action} {self.quantity_kg}kg for {self.feed.name}'
