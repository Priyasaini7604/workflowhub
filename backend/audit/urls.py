from django.urls import path
from .views import (
    AuditLogListView,
    AuditLogDetailView,
    RecordAuditLogView
)

urlpatterns = [
    path('', AuditLogListView.as_view(), name='audit-log-list'),
    path('<int:pk>/', AuditLogDetailView.as_view(), name='audit-log-detail'),
    path('record/', RecordAuditLogView.as_view(), name='audit-record'),
]
