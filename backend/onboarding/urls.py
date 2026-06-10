from django.urls import path
from .views import (
    OnboardingTaskListView,
    OnboardingTaskCreateView,
    OnboardingTaskUpdateView,
    OnboardingTaskArchiveView,
    OnboardingChecklistView,
    OnboardingChecklistUpdateView,
)

urlpatterns = [
    # Tasks
    path('<int:employee_id>/tasks/', OnboardingTaskListView.as_view(), name='onboarding-task-list'),
    path('tasks/create/', OnboardingTaskCreateView.as_view(), name='onboarding-task-create'),
    path('tasks/<int:pk>/update/', OnboardingTaskUpdateView.as_view(), name='onboarding-task-update'),
    path('tasks/<int:pk>/archive/', OnboardingTaskArchiveView.as_view(), name='onboarding-task-archive'),

    # Checklist
    path('<int:employee_id>/checklist/', OnboardingChecklistView.as_view(), name='onboarding-checklist'),
    path('checklist/<int:pk>/update/', OnboardingChecklistUpdateView.as_view(), name='onboarding-checklist-update'),
]
