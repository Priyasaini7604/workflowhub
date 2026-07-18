from rest_framework import generics, permissions
from .models import Employee
from django.utils import timezone
from .serializers import EmployeeSerializer, EmployeeListSerializer, EmployeeArchiveSerializer, EmployeeReportSerializer
from permissions import IsHROrSuperAdmin, IsHROrManagerOrSuperAdmin,IsITAdmin
from audit.utils import create_audit_log

# Employee List


class EmployeeListView(generics.ListAPIView):
    serializer_class = EmployeeListSerializer
    permission_classes = [IsHROrManagerOrSuperAdmin | IsITAdmin]

    def get_queryset(self):
        return Employee.objects.filter(is_archived=False)


# Employee Create

class EmployeeCreateView(generics.CreateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsHROrSuperAdmin]

    def generate_employee_id(self):
        existing_ids = Employee.objects.values_list('employee_id', flat=True)
        num = 1
        while True:
            new_id = f"EMP{num:03d}"
            if new_id not in existing_ids:
                return new_id
            num += 1

    def perform_create(self, serializer):
        employee_id = self.generate_employee_id()
        employee = serializer.save(
            employee_id=employee_id,
            created_by=self.request.user
        )
        create_audit_log(
            user=self.request.user,
            action='create',
            model_name='Employee',
            object_id=employee.id,
            description=f'Employee {employee.employee_id} created',
            request=self.request
        )


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
        employee = serializer.save(updated_by=self.request.user)
        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='Employee',
            object_id=employee.id,
            description=f'Employee {employee.employee_id} updated',
            request=self.request
        )


class EmployeeArchiveView(generics.UpdateAPIView):
    serializer_class = EmployeeArchiveSerializer
    permission_classes = [IsHROrSuperAdmin]

    def get_queryset(self):
        return Employee.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        employee = serializer.save(
            is_archived=True,
            archived_at=timezone.now(),
            archived_by=self.request.user
        )

        # Deactivate the linked user account so they can't log in anymore
        employee.user.is_active = False
        employee.user.save(update_fields=['is_active'])

        create_audit_log(
            user=self.request.user,
            action='delete',
            model_name='Employee',
            object_id=employee.id,
            description=f'Employee {employee.employee_id} archived',
            request=self.request
        )


class EmployeeStatusReportView(generics.ListAPIView):
    serializer_class = EmployeeReportSerializer
    permission_classes = [IsHROrSuperAdmin]

    def get_queryset(self):
        return Employee.objects.filter(is_archived=False)


class MyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return Employee.objects.get(user=self.request.user)
