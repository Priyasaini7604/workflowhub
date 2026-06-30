from .models import AuditLog


def create_audit_log(user, action, model_name, object_id, description='', request=None):
    ip_address = None
    if request:
        ip_address = request.META.get('REMOTE_ADDR')

    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=object_id,
        description=description,
        ip_address=ip_address
    )

    