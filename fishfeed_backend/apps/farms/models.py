from django.db import models
from django.conf import settings
from apps.species.models import FishSpecies


class Farm(models.Model):
    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='farms',
        limit_choices_to={'role': 'farmer'}
    )
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=500, blank=True)
    total_area_hectares = models.FloatField(default=0.0)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'farms'

    def __str__(self):
        return f'{self.name} ({self.farmer.full_name})'


class FishStock(models.Model):
    WATER_CONDITION_CHOICES = [
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ]

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='fish_stocks')
    species = models.ForeignKey(FishSpecies, on_delete=models.PROTECT, related_name='fish_stocks')
    quantity = models.IntegerField(default=0, help_text='Number of fish')
    average_weight_grams = models.FloatField(default=0.0)
    growth_stage = models.CharField(
        max_length=20,
        choices=FishSpecies.GROWTH_STAGE_CHOICES,
        default='fingerling'
    )

    water_temperature = models.FloatField(help_text='Celsius', null=True, blank=True)
    water_ph = models.FloatField(null=True, blank=True)
    dissolved_oxygen = models.FloatField(help_text='mg/L', null=True, blank=True)
    water_condition = models.CharField(max_length=10, choices=WATER_CONDITION_CHOICES, default='good')
    water_type = models.CharField(max_length=20, choices=FishSpecies.WATER_TYPE_CHOICES, default='freshwater')

    stocking_date = models.DateField()
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fish_stocks'

    def __str__(self):
        return f'{self.quantity}x {self.species.name} @ {self.farm.name}'


class FeedingHistory(models.Model):
    fish_stock = models.ForeignKey(FishStock, on_delete=models.CASCADE, related_name='feeding_history')
    feed = models.ForeignKey('feeds.FeedProduct', on_delete=models.SET_NULL, null=True, related_name='feeding_records')
    quantity_kg = models.FloatField()
    feeding_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feeding_history'
        ordering = ['-feeding_date']

    def __str__(self):
        return f'{self.feeding_date}: {self.quantity_kg}kg {self.feed.name if self.feed else "unknown"}'
