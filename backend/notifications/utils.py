from .models import Notification


def notify(recipient, title, message, notification_type='general'):
    """Create a notification for a single User. Safe to call even if
    recipient is None (e.g. an employee with no linked user) — does nothing."""
    if recipient is None:
        return None
    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
    )


def notify_many(recipients, title, message, notification_type='general'):
    """Same as notify(), but for a queryset/list of User objects — e.g.
    every user with role='hr' or role='it'."""
    for recipient in recipients:
        notify(recipient, title, message, notification_type)
