from django.contrib import admin
from .models import Farm, FishStock, FeedingHistory


class FishStockInline(admin.TabularInline):
    model = FishStock
    extra = 0
    fields = ['species', 'quantity', 'growth_stage', 'average_weight_grams', 'is_active']
    readonly_fields = ['created_at']


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ['name', 'farmer', 'location', 'total_area_hectares', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'farmer__full_name', 'location']
    readonly_fields = ['created_at']
    inlines = [FishStockInline]


@admin.register(FishStock)
class FishStockAdmin(admin.ModelAdmin):
    list_display = ['farm', 'species', 'quantity', 'growth_stage', 'average_weight_grams',
                    'water_type', 'is_active']
    list_filter = ['growth_stage', 'water_type', 'is_active', 'species']
    search_fields = ['farm__name', 'species__name', 'farm__farmer__full_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(FeedingHistory)
class FeedingHistoryAdmin(admin.ModelAdmin):
    list_display = ['fish_stock', 'feed', 'quantity_kg', 'feeding_date']
    list_filter = ['feeding_date']
    search_fields = ['fish_stock__farm__name', 'feed__name']
    date_hierarchy = 'feeding_date'
    readonly_fields = ['created_at']
