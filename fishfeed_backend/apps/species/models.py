from django.db import models
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField


class FishSpecies(models.Model):
    WATER_TYPE_CHOICES = [
        ('freshwater', 'Freshwater'),
        ('saltwater', 'Saltwater'),
        ('brackish', 'Brackish'),
    ]

    GROWTH_STAGE_CHOICES = [
        ('fry', 'Fry (0-30 days)'),
        ('fingerling', 'Fingerling (1-3 months)'),
        ('juvenile', 'Juvenile (3-6 months)'),
        ('sub_adult', 'Sub-Adult (6-12 months)'),
        ('adult', 'Adult (12+ months)'),
    ]

    name = models.CharField(max_length=200, unique=True)
    scientific_name = models.CharField(max_length=200, blank=True)
    habitat = models.CharField(max_length=200)
    water_type = models.CharField(max_length=20, choices=WATER_TYPE_CHOICES)
    growth_stage = models.CharField(max_length=20, choices=GROWTH_STAGE_CHOICES)
    image = models.ImageField(upload_to='species/', blank=True, null=True)
    description = models.TextField(blank=True)

    min_protein_requirement = models.FloatField(help_text='Minimum protein % required in feed')
    max_protein_requirement = models.FloatField(help_text='Maximum protein % in feed')
    min_fat_requirement = models.FloatField(help_text='Minimum fat % required in feed')
    max_fat_requirement = models.FloatField(help_text='Maximum fat % in feed')
    min_fiber_requirement = models.FloatField(default=0.0)
    max_fiber_requirement = models.FloatField(default=10.0)
    min_moisture_requirement = models.FloatField(default=0.0)
    max_moisture_requirement = models.FloatField(default=15.0)

    optimal_temp_min = models.FloatField(help_text='Celsius', default=20.0)
    optimal_temp_max = models.FloatField(help_text='Celsius', default=30.0)
    optimal_ph_min = models.FloatField(default=6.5)
    optimal_ph_max = models.FloatField(default=8.5)
    optimal_do_min = models.FloatField(help_text='mg/L dissolved oxygen', default=5.0)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    search_vector = SearchVectorField(null=True, blank=True)

    class Meta:
        db_table = 'fish_species'
        verbose_name = 'Fish Species'
        verbose_name_plural = 'Fish Species'
        indexes = [
            GinIndex(fields=['search_vector']),
        ]

    def __str__(self):
        return self.name

    def get_nutritional_requirements(self):
        return {
            'protein': {'min': self.min_protein_requirement, 'max': self.max_protein_requirement},
            'fat': {'min': self.min_fat_requirement, 'max': self.max_fat_requirement},
            'fiber': {'min': self.min_fiber_requirement, 'max': self.max_fiber_requirement},
            'moisture': {'min': self.min_moisture_requirement, 'max': self.max_moisture_requirement},
        }
