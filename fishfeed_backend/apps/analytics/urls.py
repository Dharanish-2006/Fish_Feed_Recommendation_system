from django.urls import path
from . import views

urlpatterns = [
    path('admin/dashboard/', views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('farmer/dashboard/', views.FarmerDashboardView.as_view(), name='farmer-dashboard'),
    path('supplier/dashboard/', views.SupplierDashboardView.as_view(), name='supplier-dashboard'),
]
