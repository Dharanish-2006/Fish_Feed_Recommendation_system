from rest_framework import serializers
from .models import Recommendation, RecommendationResult


class RecommendationResultSerializer(serializers.ModelSerializer):
    feed_name = serializers.CharField(source='feed.name', read_only=True)
    feed_brand = serializers.CharField(source='feed.brand', read_only=True)
    price_per_kg = serializers.DecimalField(
        source='feed.price_per_kg', max_digits=10, decimal_places=2, read_only=True
    )
    supplier_name = serializers.CharField(source='feed.supplier.full_name', read_only=True)

    class Meta:
        model = RecommendationResult
        fields = [
            'id', 'rank', 'feed_id', 'feed_name', 'feed_brand',
            'supplier_name', 'price_per_kg', 'match_percentage',
            'nutritional_score', 'group_score', 'explanation',
            'composition_snapshot'
        ]


class RecommendationSerializer(serializers.ModelSerializer):
    results = RecommendationResultSerializer(many=True, read_only=True)
    fish_stock_info = serializers.SerializerMethodField()
    best_feed = serializers.SerializerMethodField()

    class Meta:
        model = Recommendation
        fields = [
            'id', 'fish_stock', 'fish_stock_info', 'predicted_feed_group',
            'status', 'error_message', 'input_parameters',
            'best_feed', 'results', 'created_at', 'updated_at'
        ]
        read_only_fields = fields

    def get_fish_stock_info(self, obj):
        stock = obj.fish_stock
        return {
            'id': stock.id,
            'species': stock.species.name,
            'farm': stock.farm.name,
            'growth_stage': stock.growth_stage,
            'quantity': stock.quantity,
        }

    def get_best_feed(self, obj):
        top = obj.results.order_by('rank').first()
        if top:
            return RecommendationResultSerializer(top).data
        return None


class GenerateRecommendationSerializer(serializers.Serializer):
    fish_stock_id = serializers.IntegerField()
