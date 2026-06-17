from django.urls import path
from .views import (
    DocumentListView,
    DocumentCreateView,
    DocumentDetailView,
    DocumentVerifyView,
    DocumentArchiveView,
)

urlpatterns = [
    path('<int:employee_id>/list/',
         DocumentListView.as_view(), name='document-list'),
    path('create/', DocumentCreateView.as_view(), name='document-create'),
    path('<int:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('<int:pk>/verify/', DocumentVerifyView.as_view(), name='document-verify'),
    path('<int:pk>/archive/', DocumentArchiveView.as_view(),
         name='document-archive'),
]
