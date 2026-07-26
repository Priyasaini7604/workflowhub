from django.urls import path
from .views import (
    AssetCategoryListCreateView,
    AssetCategoryUpdateView,
    AssetCategoryArchiveView,
)

urlpatterns = [
    path(
        'categories/',
        AssetCategoryListCreateView.as_view(),
        name='asset-category-list-create'),
    path('categories/<int:pk>/update/',
         AssetCategoryUpdateView.as_view(),
         name='asset-category-update'),
    path('categories/<int:pk>/archive/',
         AssetCategoryArchiveView.as_view(),
         name='asset-category-archive'),
]
