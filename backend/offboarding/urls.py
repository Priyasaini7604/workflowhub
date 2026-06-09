from django.urls import path
from .views import (
    OffboardingTaskListView,
    OffboardingTaskCreateView,
    OffboardingTaskUpdateView,
    OffboardingTaskDeleteView,
    OffboardingChecklistView,
    OffboardingChecklistUpdateView,
)

urlpatterns = [
    # Tasks
    path('<int:employee_id>/tasks/', OffboardingTaskListView.as_view(), name='offboarding-task-list'),
    path('tasks/create/', OffboardingTaskCreateView.as_view(), name='offboarding-task-create'),
    path('tasks/<int:pk>/update/', OffboardingTaskUpdateView.as_view(), name='offboarding-task-update'),
    path('tasks/<int:pk>/delete/', OffboardingTaskDeleteView.as_view(), name='offboarding-task-delete'),

    # Checklist
    path('<int:employee_id>/checklist/', OffboardingChecklistView.as_view(), name='offboarding-checklist'),
    path('checklist/<int:pk>/update/', OffboardingChecklistUpdateView.as_view(), name='offboarding-checklist-update'),
]
