from django.urls import path
from .views import (
    AuditLogListView,
    AuditLogCreateView,
    AuditLogDetailView,
)

urlpatterns = [
    path('', AuditLogListView.as_view(), name='audit-log-list'),
    path('create/', AuditLogCreateView.as_view(), name='audit-log-create'),
    path('<int:pk>/', AuditLogDetailView.as_view(), name='audit-log-detail'),
]
