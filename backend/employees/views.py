from rest_framework import generics
from .models import Employee
from .serializers import EmployeeSerializer, EmployeeListSerializer, EmployeeArchiveSerializer
from permissions import IsHROrSuperAdmin, IsHROrManagerOrSuperAdmin


# Employee List
class EmployeeListView(generics.ListAPIView):
    serializer_class = EmployeeListSerializer
    permission_classes = [IsHROrManagerOrSuperAdmin]

    def get_queryset(self):
        return Employee.objects.filter(is_archived=False)


# Employee Create
class EmployeeCreateView(generics.CreateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsHROrSuperAdmin]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# Employee Detail
class EmployeeDetailView(generics.RetrieveAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsHROrManagerOrSuperAdmin]

    def get_queryset(self):
        return Employee.objects.filter(is_archived=False)


# Employee Update
class EmployeeUpdateView(generics.UpdateAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsHROrSuperAdmin]

    def get_queryset(self):
        return Employee.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class EmployeeArchiveView(generics.UpdateAPIView):
    serializer_class=EmployeeArchiveSerializer
    permission_classes=[IsHROrSuperAdmin]

    def get_queryset(self):
        return Employee.objects.filte(is_archived=False)
    
    def perform_update(self, serializer):
        from django.utils import timezone
        serializer.save(
            is_archived=True,
            archived_at=timezone.now(),
            archived_by=self.request.user
        )
