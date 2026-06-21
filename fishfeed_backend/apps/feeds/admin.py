from django.contrib import admin
from .models import FeedProduct, FeedInventoryLog


class FeedInventoryLogInline(admin.TabularInline):
    model = FeedInventoryLog
    extra = 0
    readonly_fields = ['created_at']
    can_delete = False


@admin.register(FeedProduct)
class FeedProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'supplier', 'protein_percentage', 'fat_percentage',
                    'price_per_kg', 'stock_quantity_kg', 'is_available']
    list_filter = ['feed_form', 'is_available', 'supplier']
    search_fields = ['name', 'brand', 'supplier__full_name']
    filter_horizontal = ['suitable_species']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [FeedInventoryLogInline]

    fieldsets = (
        ('Product Info', {
            'fields': ('supplier', 'name', 'brand', 'feed_form', 'image', 'description')
        }),
        ('Nutritional Composition (%)', {
            'fields': (
                ('protein_percentage', 'fat_percentage'),
                ('fiber_percentage', 'moisture_percentage'),
                ('ash_percentage', 'energy_kcal_per_kg'),
            )
        }),
        ('Suitable Species', {'fields': ('suitable_species',)}),
        ('Pricing & Stock', {
            'fields': (('price_per_kg', 'currency'), 'stock_quantity_kg', 'is_available')
        }),
        ('Metadata', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


@admin.register(FeedInventoryLog)
class FeedInventoryLogAdmin(admin.ModelAdmin):
    list_display = ['feed', 'action', 'quantity_kg', 'created_at']
    list_filter = ['action']
    readonly_fields = ['created_at']
