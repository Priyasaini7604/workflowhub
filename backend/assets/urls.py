from django.urls import path
from .views import (
    AssetListView,
    AssetCreateView,
    AssetDetailView,
    AssetUpdateView,
    AssetArchiveView,
    AssetAssignView,
)

urlpatterns = [
    path('', AssetListView.as_view(), name='asset-list'),
    path('create/', AssetCreateView.as_view(), name='asset-create'),
    path('<int:pk>/', AssetDetailView.as_view(), name='asset-detail'),
    path('<int:pk>/update/', AssetUpdateView.as_view(), name='asset-update'),
    path('<int:pk>/archive/', AssetArchiveView.as_view(), name='asset-archive'),
    path('<int:pk>/assign/', AssetAssignView.as_view(), name='asset-assign'),
]
