from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.GenerateRecommendationView.as_view(), name='generate-recommendation'),
    path('', views.RecommendationListView.as_view(), name='recommendation-list'),
    path('<int:pk>/', views.RecommendationDetailView.as_view(), name='recommendation-detail'),
    path('stock/<int:stock_pk>/latest/', views.LatestRecommendationForStockView.as_view(), name='latest-recommendation'),
]
