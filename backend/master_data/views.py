from rest_framework import generics
from django.utils import timezone
from .models import AssetCategory
from .serializers import AssetCategorySerializer
from permissions import IsITAdminOrSuperAdmin
from audit.utils import create_audit_log


class AssetCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = AssetCategorySerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return AssetCategory.objects.filter(is_archived=False)

    def perform_create(self, serializer):
        category = serializer.save(created_by=self.request.user)
        create_audit_log(
            user=self.request.user,
            action='create',
            model_name='AssetCategory',
            object_id=category.id,
            description=f'Asset category "{category.name}" created',
            request=self.request
        )


class AssetCategoryUpdateView(generics.UpdateAPIView):
    serializer_class = AssetCategorySerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return AssetCategory.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        category = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='AssetCategory',
            object_id=category.id,
            description=f'Asset category "{category.name}" updated',
            request=self.request
        )


class AssetCategoryArchiveView(generics.UpdateAPIView):
    """Soft delete — asset categories are not hard-deleted (since existing
        assets may still be linked to them), only archived/deactivated."""
    serializer_class = AssetCategorySerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return AssetCategory.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        category = serializer.save(
            is_archived=True,
            is_active=False,
            archived_at=timezone.now()
        )
        create_audit_log(
            user=self.request.user,
            action='delete',
            model_name='AssetCategory',
            object_id=category.id,
            description=f'Asset category "{category.name}" archived',
            request=self.request
        )
