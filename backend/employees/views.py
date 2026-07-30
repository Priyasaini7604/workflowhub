from rest_framework import generics, permissions, status
from .models import Employee
from django.utils import timezone
from rest_framework.response import Response
from .serializers import (EmployeeSerializer,
                          EmployeeListSerializer,
                          EmployeeArchiveSerializer,
                          EmployeeReportSerializer)
from permissions import IsHROrSuperAdmin, IsHROrManagerOrSuperAdmin, IsITAdmin
from .serializers import EmployeeStatusUpdateSerializer
from rest_framework.exceptions import NotFound
from audit.utils import create_audit_log

# Employee List


class EmployeeListView(generics.ListAPIView):
    serializer_class = EmployeeListSerializer
    permission_classes = [IsHROrManagerOrSuperAdmin | IsITAdmin]

    def get_queryset(self):
        archived_param = self.request.query_params.get('archived', 'false')
        is_archived = archived_param.lower() == 'true'
        return Employee.objects.filter(is_archived=is_archived)


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
        return Employee.objects.all()


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


class EmployeeReactivateView(generics.UpdateAPIView):
    serializer_class = EmployeeArchiveSerializer
    permission_classes = [IsHROrSuperAdmin]

    def get_queryset(self):
        # Sirf archived employees hi is view se dikhenge/reactivate honge
        return Employee.objects.filter(is_archived=True)

    def perform_update(self, serializer):
        employee = serializer.save(
            is_archived=False,
            archived_at=None,
            archived_by=None,
            current_status='active',
            status_start_date=timezone.now().date(),
        )

        # Linked user account ko wapas activate karo taaki wo login kar sake
        employee.user.is_active = True
        employee.user.save(update_fields=['is_active'])

        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='Employee',
            object_id=employee.id,
            description=f'Employee {employee.employee_id} reactivated',
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
        try:
            return Employee.objects.get(user=self.request.user)
        except Employee.DoesNotExist:
            raise NotFound(
                detail="No employee profile linked to this account.")


class EmployeeStatusUpdateView(generics.GenericAPIView):
    serializer_class = EmployeeStatusUpdateSerializer
    permission_classes = [IsHROrSuperAdmin]
    queryset = Employee.objects.filter(is_archived=False)

    def patch(self, request, *args, **kwargs):
        employee = self.get_object()
        serializer = self.get_serializer(
            data=request.data,
            context={'employee': employee}
        )
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['new_status']
        now = timezone.now()

        employee.current_status = new_status
        employee.status_start_date = now.date()

        if new_status == 'notice_period':
            employee.notice_period_start_date = now.date()
        elif new_status == 'offboarding':
            employee.last_working_date = now.date()
        elif new_status == 'exited':
            employee.exit_date = now.date()

        employee.updated_by = request.user
        employee.save()

        create_audit_log(
            user=request.user,
            action='update',
            model_name='Employee',
            object_id=employee.id,
            description=f'Employee {
                employee.employee_id} status changed to {new_status}',
            request=request
        )

        return Response(
            {'message': f'Status updated to {new_status}',
                'current_status': new_status},
            status=status.HTTP_200_OK
        )
