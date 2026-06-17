from django.urls import path
from .views import (
    EmployeeListView,
    EmployeeCreateView,
    EmployeeDetailView,
    EmployeeUpdateView,
    EmployeeArchiveView,
    EmployeeStatusReportView,
)

urlpatterns = [
    path('', EmployeeListView.as_view(), name='employee-list'),
    path('create/', EmployeeCreateView.as_view(), name='employee-create'),
    path('report/', EmployeeStatusReportView.as_view(),
         name='employee-status-report'),
    path('<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('<int:pk>/update/', EmployeeUpdateView.as_view(), name='employee-update'),
    path('<int:pk>/archive/', EmployeeArchiveView.as_view(),
         name='employee-archive'),
]
