from django.urls import path
from . import views

urlpatterns = [
    path('', views.FarmListCreateView.as_view(), name='farm-list'),
    path('<int:pk>/', views.FarmDetailView.as_view(), name='farm-detail'),
    path('<int:farm_pk>/stocks/', views.FishStockListCreateView.as_view(), name='stock-list'),
    path('stocks/<int:pk>/', views.FishStockDetailView.as_view(), name='stock-detail'),
    path('feeding-history/', views.FeedingHistoryListCreateView.as_view(), name='feeding-history'),
]
