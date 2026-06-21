from django.urls import path
from . import views

urlpatterns = [
    path('', views.FishSpeciesListView.as_view(), name='species-list'),
    path('<int:pk>/', views.FishSpeciesDetailView.as_view(), name='species-detail'),
    path('admin/create/', views.FishSpeciesAdminCreateView.as_view(), name='species-admin-create'),
    path('admin/<int:pk>/', views.FishSpeciesAdminUpdateView.as_view(), name='species-admin-update'),
]
