from django.contrib import admin
from .models import FishSpecies


@admin.register(FishSpecies)
class FishSpeciesAdmin(admin.ModelAdmin):
    list_display = ['name', 'scientific_name', 'water_type', 'growth_stage', 'is_active']
    list_filter = ['water_type', 'growth_stage', 'is_active']
    search_fields = ['name', 'scientific_name', 'habitat']
    readonly_fields = ['created_at', 'updated_at', 'search_vector']

    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'scientific_name', 'habitat', 'water_type', 'growth_stage', 'image', 'description', 'is_active')
        }),
        ('Nutritional Requirements', {
            'fields': (
                ('min_protein_requirement', 'max_protein_requirement'),
                ('min_fat_requirement', 'max_fat_requirement'),
                ('min_fiber_requirement', 'max_fiber_requirement'),
                ('min_moisture_requirement', 'max_moisture_requirement'),
            )
        }),
        ('Optimal Water Conditions', {
            'fields': (
                ('optimal_temp_min', 'optimal_temp_max'),
                ('optimal_ph_min', 'optimal_ph_max'),
                'optimal_do_min',
            )
        }),
        ('Metadata', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
