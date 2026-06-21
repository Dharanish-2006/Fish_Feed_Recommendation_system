from django.contrib import admin
from .models import Recommendation, RecommendationResult


class RecommendationResultInline(admin.TabularInline):
    model = RecommendationResult
    extra = 0
    readonly_fields = ['rank', 'feed', 'match_percentage', 'nutritional_score',
                       'group_score', 'explanation']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ['id', 'farmer', 'fish_stock', 'predicted_feed_group', 'status', 'created_at']
    list_filter = ['status', 'predicted_feed_group']
    search_fields = ['farmer__full_name', 'farmer__email', 'fish_stock__species__name']
    readonly_fields = ['input_parameters', 'created_at', 'updated_at']
    inlines = [RecommendationResultInline]
    date_hierarchy = 'created_at'


@admin.register(RecommendationResult)
class RecommendationResultAdmin(admin.ModelAdmin):
    list_display = ['recommendation', 'rank', 'feed', 'match_percentage', 'nutritional_score']
    list_filter = ['rank']
    search_fields = ['feed__name', 'recommendation__farmer__email']
    readonly_fields = ['composition_snapshot']
