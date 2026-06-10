from django.urls import path
from .views import (
    EmployeeListView,
    EmployeeCreateView,
    EmployeeDetailView,
    EmployeeUpdateView,
    EmployeeArchiveView,
)

urlpatterns = [
    path('', EmployeeListView.as_view(), name='employee-list'),
    path('create/', EmployeeCreateView.as_view(), name='employee-create'),
    path('<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('<int:pk>/update/', EmployeeUpdateView.as_view(), name='employee-update'),
    path('<int:pk>/archive/', EmployeeArchiveView.as_view(), name='employee-archive'),
]
