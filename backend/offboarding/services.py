from django.utils import timezone
from users.models import User
from employees.models import Employee
from access.models import SoftwareAccess
from notifications.utils import notify, notify_many


def is_access_revoked(employee):
    """Live check against the SoftwareAccess table — whether the employee
    has any active access left. Used by both the model and the serializer
    so this logic lives in exactly one place."""
    return not SoftwareAccess.objects.filter(
        employee=employee, status='active', is_archived=False
    ).exists()


def sync_employee_lifecycle_from_checklist(checklist):
    """Keep Employee lifecycle fields in sync with the offboarding
    checklist, so HR doesn't have to manually re-type the same dates
    in Edit Employee."""
    employee = checklist.employee
    today = timezone.now().date()
    changed = False

    if checklist.resignation_date and not employee.notice_period_start_date:
        employee.notice_period_start_date = checklist.resignation_date
        changed = True

    if (checklist.final_clearance_status
            and employee.current_status != 'inactive'):
        employee.last_working_date = today
        employee.exit_date = today
        employee.current_status = 'inactive'
        employee.status_start_date = today
        changed = True

    if changed:
        employee.save()


def is_managers_team_member(user, employee_id):
    """A Manager may only touch offboarding data for employees who
    actually report to them — this is checked against
    reporting_manager, not just role."""
    return Employee.objects.filter(
        id=employee_id,
        reporting_manager__user=user
    ).exists()


TASK_NAME_TO_CHECKLIST_FIELD = {
    'Recover company laptop and IT assets': ('asset_recovery_status', True),
    'Revoke system and email access': ('access_revocation_status', True),
    'Conduct exit interview': ('exit_interview_status', 'completed'),
    'Manager sign-off and handover': ('manager_clearance_status', True),
    'Complete HR final settlement clearance': ('hr_clearance_status', True),
}


def sync_checklist_from_task_completion(task, checklist):
    """When a task is completed, update the checklist's corresponding
    field, and auto-derive final clearance once all four operational
    clearances are done."""
    if task.status == 'completed':
        mapping = TASK_NAME_TO_CHECKLIST_FIELD.get(task.task_name)
        if mapping:
            field_name, value = mapping
            setattr(checklist, field_name, value)

    if (checklist.asset_recovery_status
            and checklist.access_revocation_status
            and checklist.manager_clearance_status
            and checklist.hr_clearance_status):
        checklist.final_clearance_status = True

    checklist.save()
    return checklist


def notify_task_completed(task):
    """Let HR know whenever any offboarding task is marked complete."""
    notify_many(
        User.objects.filter(role='hr'),
        title='Offboarding task completed',
        message=(
            f'"{task.task_name}" ({task.assigned_to_role}) '
            f'completed for {task.employee}.'
        ),
        notification_type='offboarding',
    )


DEFAULT_OFFBOARDING_TASKS = [
    ('Recover company laptop and IT assets', 'it'),
    ('Revoke system and email access', 'it'),
    ('Conduct exit interview', 'hr'),
    ('Manager sign-off and handover', 'manager'),
    ('Complete HR final settlement clearance', 'hr'),
]


def create_default_offboarding_tasks(employee_id):
    """Bulk-create the standard set of offboarding tasks for an
    employee when their offboarding checklist is first created."""
    from .models import OffboardingTask
    OffboardingTask.objects.bulk_create([
        OffboardingTask(
            employee_id=employee_id,
            task_name=name,
            assigned_to_role=role,
        )
        for name, role in DEFAULT_OFFBOARDING_TASKS
    ])


def notify_offboarding_started(employee):
    """Let each role responsible for a default task know offboarding
    has started — one notification per distinct role, not per task."""
    roles_notified = set()
    for _, role in DEFAULT_OFFBOARDING_TASKS:
        if role in roles_notified:
            continue
        roles_notified.add(role)

        if role == 'it':
            notify_many(
                User.objects.filter(role='it'),
                title='New offboarding task',
                message=(
                    f'{employee} is offboarding — please complete '
                    'your IT tasks.'
                ),
                notification_type='offboarding',
            )
        elif role == 'hr':
            notify_many(
                User.objects.filter(role='hr'),
                title='New offboarding task',
                message=(
                    f'{employee} is offboarding — please complete '
                    'your HR tasks.'
                ),
                notification_type='offboarding',
            )
        elif role == 'manager' and employee.reporting_manager:
            notify(
                getattr(employee.reporting_manager, 'user', None),
                title='New offboarding task',
                message=(
                    f'{employee} (your team member) is offboarding — '
                    'please complete your sign-off task.'
                ),
                notification_type='offboarding',
            )
        elif role == 'employee':
            notify(
                getattr(employee, 'user', None),
                title='Offboarding started',
                message='Your offboarding process has started.',
                notification_type='offboarding',
            )
