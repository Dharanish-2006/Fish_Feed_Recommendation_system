from rest_framework import generics, permissions
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from .models import FishSpecies
from .serializers import FishSpeciesSerializer, FishSpeciesListSerializer
from apps.users.permissions import IsAdminUser


class FishSpeciesListView(generics.ListAPIView):
    serializer_class = FishSpeciesListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['water_type', 'growth_stage', 'is_active']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        qs = FishSpecies.objects.filter(is_active=True)
        q = self.request.query_params.get('q')
        if q:
            search_query = SearchQuery(q)
            qs = qs.annotate(rank=SearchRank('search_vector', search_query)) \
                   .filter(search_vector=search_query) \
                   .order_by('-rank')
        return qs


class FishSpeciesDetailView(generics.RetrieveAPIView):
    serializer_class = FishSpeciesSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = FishSpecies.objects.filter(is_active=True)


class FishSpeciesAdminCreateView(generics.CreateAPIView):
    serializer_class = FishSpeciesSerializer
    permission_classes = [IsAdminUser]
    queryset = FishSpecies.objects.all()


class FishSpeciesAdminUpdateView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FishSpeciesSerializer
    permission_classes = [IsAdminUser]
    queryset = FishSpecies.objects.all()
