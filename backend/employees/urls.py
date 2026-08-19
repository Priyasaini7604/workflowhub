from django.urls import path
from .views import (
    EmployeeListView,
    EmployeeCreateView,
    EmployeeDetailView,
    EmployeeUpdateView,
    EmployeeArchiveView,
    EmployeeStatusReportView,
    EmployeeStatusUpdateView,
    MyProfileView,
    EmployeeReactivateView,
    EmployeeReportExportCSVView,
    EmployeeReportExportPDFView,
    CandidateCreateView,
)

urlpatterns = [
    path('', EmployeeListView.as_view(), name='employee-list'),
    path('create/', EmployeeCreateView.as_view(), name='employee-create'),
    path('report/', EmployeeStatusReportView.as_view(),
         name='employee-status-report'),
    path('<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path(
        '<int:pk>/update/',
        EmployeeUpdateView.as_view(),
        name='employee-update'),
    path('<int:pk>/status/', EmployeeStatusUpdateView.as_view(),
         name='employee-status-update'),
    path('<int:pk>/archive/', EmployeeArchiveView.as_view(),
         name='employee-archive'),
    path('me/', MyProfileView.as_view(), name='my-profile'),
    path(
        '<int:pk>/reactivate/',
        EmployeeReactivateView.as_view(),
        name='employee-reactivate'),
    path(
        'report/export/csv/',
        EmployeeReportExportCSVView.as_view(),
        name='employee-report-export-csv'),
    path(
        'report/export/pdf/',
        EmployeeReportExportPDFView.as_view(),
        name='employee-report-export-pdf'),
    path('candidates/create/', CandidateCreateView.as_view(), name='candidate-create'),


]
