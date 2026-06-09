from rest_framework import generics, permissions
from .models import OffboardingTask, OffboardingChecklist
from .serializers import (
    OffboardingTaskSerializer,
    OffboardingTaskCreateSerializer,
    OffboardingChecklistSerializer,
    OffboardingChecklistUpdateSerializer,
)


# Offboarding Task List
class OffboardingTaskListView(generics.ListAPIView):
    serializer_class = OffboardingTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        employee_id = self.kwargs.get('employee_id')
        return OffboardingTask.objects.filter(employee=employee_id)


# Offboarding Task Create
class OffboardingTaskCreateView(generics.CreateAPIView):
    queryset = OffboardingTask.objects.all()
    serializer_class = OffboardingTaskCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


# Offboarding Task Update
class OffboardingTaskUpdateView(generics.UpdateAPIView):
    queryset = OffboardingTask.objects.all()
    serializer_class = OffboardingTaskCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


# Offboarding Task Delete
class OffboardingTaskDeleteView(generics.DestroyAPIView):
    queryset = OffboardingTask.objects.all()
    serializer_class = OffboardingTaskSerializer
    permission_classes = [permissions.IsAuthenticated]


# Offboarding Checklist
class OffboardingChecklistView(generics.RetrieveAPIView):
    serializer_class = OffboardingChecklistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        employee_id = self.kwargs.get('employee_id')
        return OffboardingChecklist.objects.get(employee=employee_id)


# Offboarding Checklist Update
class OffboardingChecklistUpdateView(generics.UpdateAPIView):
    queryset = OffboardingChecklist.objects.all()
    serializer_class = OffboardingChecklistUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
