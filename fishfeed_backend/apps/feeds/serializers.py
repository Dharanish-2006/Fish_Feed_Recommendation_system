from rest_framework import serializers
from .models import FeedProduct, FeedInventoryLog
from apps.species.serializers import FishSpeciesListSerializer
from apps.users.serializers import UserProfileSerializer


class FeedProductSerializer(serializers.ModelSerializer):
    supplier_info = UserProfileSerializer(source='supplier', read_only=True)
    suitable_species_info = FishSpeciesListSerializer(source='suitable_species', many=True, read_only=True)
    composition = serializers.SerializerMethodField()

    class Meta:
        model = FeedProduct
        fields = '__all__'
        read_only_fields = ['id', 'supplier', 'created_at', 'updated_at']

    def get_composition(self, obj):
        return obj.get_composition()

    def validate(self, data):
        total = (
            data.get('protein_percentage', 0) +
            data.get('fat_percentage', 0) +
            data.get('fiber_percentage', 0) +
            data.get('moisture_percentage', 0) +
            data.get('ash_percentage', 0)
        )
        if total > 100:
            raise serializers.ValidationError('Sum of nutritional components cannot exceed 100%.')
        return data


class FeedProductListSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.full_name', read_only=True)

    class Meta:
        model = FeedProduct
        fields = [
            'id', 'name', 'brand', 'feed_form', 'protein_percentage',
            'fat_percentage', 'price_per_kg', 'currency', 'is_available',
            'stock_quantity_kg', 'supplier_name', 'image'
        ]


class FeedInventoryLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedInventoryLog
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class UpdateInventorySerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['add', 'sell', 'adjust'])
    quantity_kg = serializers.FloatField(min_value=0)
    notes = serializers.CharField(required=False, allow_blank=True)
