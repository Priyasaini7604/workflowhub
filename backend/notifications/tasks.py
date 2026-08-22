from celery import shared_task
from django.core.mail import send_mail
from datetime import date, timedelta


@shared_task
def send_email_notification_task(notification_id):
    from .models import Notification
    try:
        n = Notification.objects.get(id=notification_id)
    except Notification.DoesNotExist:
        return
    if not n.recipient.email:
        return
    send_mail(
        subject=n.title,
        message=n.message,
        from_email=None,
        recipient_list=[n.recipient.email],
        fail_silently=True,
    )


@shared_task
def check_due_and_overdue_tasks():
    from .utils import notify, notify_many
    from users.models import User
    from onboarding.models import OnboardingTask
    from offboarding.models import OffboardingTask

    today = date.today()
    tomorrow = today + timedelta(days=1)

    def resolve_and_notify(task, title, message):
        if task.assigned_to_role == 'employee':
            notify(task.employee.user, title, message)
        else:
            role_users = User.objects.filter(
                role=task.assigned_to_role, is_active=True
            )
            notify_many(role_users, title, message)

    for model in [OnboardingTask, OffboardingTask]:
        pending_tasks = model.objects.filter(
            status__in=['pending', 'in_progress'],
            is_archived=False,
            due_date__isnull=False,
        )

        for task in pending_tasks:
            if task.due_date == tomorrow:
                resolve_and_notify(
                    task,
                    f"Task due tomorrow: {
                        task.task_name}",
                    f"The task '{
                        task.task_name}' for {
                        task.employee} is due on {
                        task.due_date}.")
            elif task.due_date < today:
                resolve_and_notify(
                    task,
                    f"Overdue task: {
                        task.task_name}",
                    f"The task '{
                        task.task_name}' for {
                        task.employee} was due on {
                        task.due_date} and is now overdue.")
