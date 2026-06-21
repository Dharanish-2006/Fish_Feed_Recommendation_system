from django.urls import path
from . import views

urlpatterns = [
    path('', views.FeedProductListView.as_view(), name='feed-list'),
    path('<int:pk>/', views.FeedProductDetailView.as_view(), name='feed-detail'),
    path('my/', views.SupplierFeedListView.as_view(), name='supplier-feed-list'),
    path('my/<int:pk>/', views.SupplierFeedDetailView.as_view(), name='supplier-feed-detail'),
    path('my/<int:pk>/inventory/', views.UpdateInventoryView.as_view(), name='update-inventory'),
    path('my/<int:pk>/inventory/logs/', views.FeedInventoryLogView.as_view(), name='inventory-logs'),
]
