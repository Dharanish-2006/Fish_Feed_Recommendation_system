from rest_framework import serializers
from .models import Farm, FishStock, FeedingHistory
class FarmSerializer(serializers.ModelSerializer):
    fish_stocks_count = serializers.SerializerMethodField()

    class Meta:
        model = Farm
        fields = '__all__'
        read_only_fields = ['id', 'farmer', 'created_at']

    def get_fish_stocks_count(self, obj):
        return obj.fish_stocks.filter(is_active=True).count()


class FishStockSerializer(serializers.ModelSerializer):
    species_name = serializers.CharField(source='species.name', read_only=True)
    farm_name    = serializers.CharField(source='farm.name',    read_only=True)

    class Meta:
        model  = FishStock
        fields = '__all__'
        read_only_fields = ['id', 'farm', 'created_at', 'updated_at']

    def validate(self, data):
        request = self.context.get('request')
        if not request:
            return data
        farm = (
            data.get('farm')
            or (self.instance.farm if self.instance else None)
        )

        if farm and farm.farmer != request.user and request.user.role != 'admin':
            raise serializers.ValidationError(
                {'farm': 'You do not own this farm.'}
            )
        return data


class FeedingHistorySerializer(serializers.ModelSerializer):
    feed_name    = serializers.CharField(source='feed.name',              read_only=True)
    species_name = serializers.CharField(source='fish_stock.species.name', read_only=True)
    class Meta:
        model  = FeedingHistory
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
