from rest_framework import generics, permissions
from .models import OnboardingTask, OnboardingChecklist
from .serializers import (
    OnboardingTaskSerializer,
    OnboardingTaskCreateSerializer,
    OnboardingChecklistSerializer,
    OnboardingChecklistUpdateSerializer,
)


# Onboarding Task List of Employees
class OnboardingTaskListView(generics.ListAPIView):
    serializer_class = OnboardingTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        employee_id = self.kwargs.get('employee_id')
        return OnboardingTask.objects.filter(employee=employee_id)


# Onboarding Task Create new task
class OnboardingTaskCreateView(generics.CreateAPIView):
    queryset = OnboardingTask.objects.all()
    serializer_class = OnboardingTaskCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


# Onboarding Task Update
class OnboardingTaskUpdateView(generics.UpdateAPIView):
    queryset = OnboardingTask.objects.all()
    serializer_class = OnboardingTaskCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


# Onboarding Task Delete
class OnboardingTaskDeleteView(generics.DestroyAPIView):
    queryset = OnboardingTask.objects.all()
    serializer_class = OnboardingTaskSerializer
    permission_classes = [permissions.IsAuthenticated]


# Onboarding Checklist
class OnboardingChecklistView(generics.RetrieveAPIView):
    serializer_class = OnboardingChecklistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        employee_id = self.kwargs.get('employee_id')
        return OnboardingChecklist.objects.get(employee=employee_id)


# Onboarding Checklist Update
class OnboardingChecklistUpdateView(generics.UpdateAPIView):
    queryset = OnboardingChecklist.objects.all()
    serializer_class = OnboardingChecklistUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
