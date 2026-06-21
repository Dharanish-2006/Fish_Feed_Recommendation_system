from rest_framework import serializers
from .models import FishSpecies


class FishSpeciesSerializer(serializers.ModelSerializer):
    nutritional_requirements = serializers.SerializerMethodField()

    class Meta:
        model = FishSpecies
        fields = '__all__'
        read_only_fields = ['id', 'search_vector', 'created_at', 'updated_at']

    def get_nutritional_requirements(self, obj):
        return obj.get_nutritional_requirements()


class FishSpeciesListSerializer(serializers.ModelSerializer):
    """Compact serializer for list views."""
    class Meta:
        model = FishSpecies
        fields = ['id', 'name', 'scientific_name', 'water_type', 'growth_stage', 'image', 'habitat']
