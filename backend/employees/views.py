import secrets
from rest_framework import generics, permissions, status
from .models import Employee
from django.utils import timezone
from rest_framework.response import Response
from .serializers import (EmployeeSerializer,
                          EmployeeListSerializer,
                          EmployeeArchiveSerializer,
                          EmployeeReportSerializer,
                          CandidateCreateSerializer)
from permissions import IsHROrSuperAdmin, IsHROrManagerOrSuperAdmin, IsITAdmin
from .serializers import EmployeeStatusUpdateSerializer
from rest_framework.exceptions import NotFound
from audit.utils import create_audit_log
import csv
from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from users.models import User
# Employee List


def _generate_employee_id():
    existing_ids = Employee.objects.values_list('employee_id', flat=True)
    num = 1
    while True:
        new_id = f"EMP{num:03d}"
        if new_id not in existing_ids:
            return new_id
        num += 1


class EmployeeListView(generics.ListAPIView):
    serializer_class = EmployeeListSerializer
    permission_classes = [IsHROrManagerOrSuperAdmin | IsITAdmin]

    def get_queryset(self):
        archived_param = self.request.query_params.get('archived', 'false')
        is_archived = archived_param.lower() == 'true'
        queryset = Employee.objects.filter(is_archived=is_archived)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(employee_id__icontains=search)
            )
        return queryset

    @property
    def pagination_class(self):
        if self.request.query_params.get('all') == 'true':
            return None
        return PageNumberPagination


# Employee Create

class EmployeeCreateView(generics.CreateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsHROrSuperAdmin]

    def generate_employee_id(self):
        return _generate_employee_id()

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

# Candidate Create — lightweight intake, no user account / employee_id yet


class CandidateCreateView(generics.CreateAPIView):
    queryset = Employee.objects.all()
    serializer_class = CandidateCreateSerializer
    permission_classes = [IsHROrSuperAdmin]

    def perform_create(self, serializer):
        employee = serializer.save(
            current_status='candidate',
            status_start_date=timezone.now().date(),
            created_by=self.request.user
        )
        create_audit_log(
            user=self.request.user,
            action='create',
            model_name='Employee',
            object_id=employee.id,
            description=f'Candidate {
                employee.first_name} {
                employee.last_name} added',
            request=self.request)


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
        # (candidates have no linked user yet — nothing to deactivate)
        if employee.user:
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

        if employee.user:
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

        # Candidate/offer_sent -> joining_pending: this is where a real
        # employee account gets provisioned. No user/employee_id exist
        # before this point.
        temp_password = None
        if new_status == 'joining_pending' and employee.user is None:
            employee_id = _generate_employee_id()
            username = employee_id.lower()
            temp_password = secrets.token_urlsafe(9)

            user = User.objects.create_user(
                username=username,
                password=temp_password,
                role='employee'
            )

            employee.user = user
            employee.employee_id = employee_id

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

        response_data = {
            'message': f'Status updated to {new_status}',
            'current_status': new_status,
        }
        if temp_password:
            response_data['username'] = employee.user.username
            response_data['temp_password'] = temp_password
            response_data['employee_id'] = employee.employee_id

        return Response(response_data, status=status.HTTP_200_OK)


class EmployeeReportExportCSVView(generics.GenericAPIView):
    permission_classes = [IsHROrSuperAdmin]

    def get_queryset(self):
        return Employee.objects.filter(is_archived=False)

    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="employee_report.csv"'

        writer = csv.writer(response)

        # Header row
        writer.writerow([
            'Employee ID', 'Full Name', 'Department', 'Designation',
            'Current Status', 'Status Start Date', 'Onboarding %',
            'Asset Count', 'Manager', 'Employee Type', 'Date of Joining',
        ])

        # Data rows — same logic jo serializer mein hai
        for emp in queryset:
            full_name = (
                f"{emp.first_name} {emp.middle_name} {emp.last_name}"
                if emp.middle_name
                else f"{emp.first_name} {emp.last_name}"
            )

            manager_name = (
                f"{emp.reporting_manager.first_name} {emp.reporting_manager.last_name}"
                if emp.reporting_manager
                else ""
            )

            asset_count = emp.assigned_assets.filter(is_archived=False).count()

            onboarding_percentage = (
                emp.onboarding_checklist.onboarding_completion_percentage
                if hasattr(emp, 'onboarding_checklist')
                else 0
            )

            writer.writerow([
                emp.employee_id,
                full_name,
                emp.department,
                emp.designation,
                emp.current_status,
                emp.status_start_date or "",
                onboarding_percentage,
                asset_count,
                manager_name,
                emp.employee_type,
                emp.date_of_joining or "",
            ])

        return response


class EmployeeReportExportPDFView(generics.GenericAPIView):
    permission_classes = [IsHROrSuperAdmin]

    def get_queryset(self):
        return Employee.objects.filter(is_archived=False)

    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="employee_report.pdf"'

        doc = SimpleDocTemplate(
            response,
            pagesize=landscape(A4),
            topMargin=15 * mm,
            bottomMargin=15 * mm,
        )

        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("Employee Status Report", styles['Title']))
        elements.append(Spacer(1, 10))

        # Header row
        data = [['Employee ID',
                 'Full Name',
                 'Department',
                 'Designation',
                 'Status',
                 'Onboarding %',
                 'Assets',
                 'Manager',
                 'Type',
                 'Joining Date',
                 ]]

        for emp in queryset:
            full_name = (
                f"{emp.first_name} {emp.middle_name} {emp.last_name}"
                if emp.middle_name
                else f"{emp.first_name} {emp.last_name}"
            )

            manager_name = (
                f"{emp.reporting_manager.first_name} {emp.reporting_manager.last_name}"
                if emp.reporting_manager
                else "-"
            )

            asset_count = emp.assigned_assets.filter(is_archived=False).count()

            onboarding_percentage = (
                emp.onboarding_checklist.onboarding_completion_percentage
                if hasattr(emp, 'onboarding_checklist')
                else 0
            )

            data.append([
                emp.employee_id,
                full_name,
                emp.department,
                emp.designation,
                emp.current_status,
                str(onboarding_percentage),
                str(asset_count),
                manager_name,
                emp.employee_type,
                str(emp.date_of_joining) if emp.date_of_joining else "-",
            ])

        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1),
             [colors.white, colors.HexColor('#f1f5f9')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))

        elements.append(table)
        doc.build(elements)

        return response
