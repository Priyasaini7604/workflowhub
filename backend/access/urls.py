from django.urls import path
from .views import (
    SoftwareAccessListCreateView,
    SoftwareAccessDetailView,
    SoftwareAccessRevokeView,
    EmployeePendingAccessView,
)

urlpatterns = [
    path(
        '',
        SoftwareAccessListCreateView.as_view(),
        name='access-list-create'),
    path(
        '<int:pk>/',
        SoftwareAccessDetailView.as_view(),
        name='access-detail'),
    path(
        '<int:pk>/revoke/',
        SoftwareAccessRevokeView.as_view(),
        name='access-revoke'),
    path(
        'employee/<int:employee_id>/pending/',
        EmployeePendingAccessView.as_view(),
        name='access-pending'),
]
