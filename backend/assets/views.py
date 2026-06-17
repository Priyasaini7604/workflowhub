from rest_framework import generics, permissions
from django.utils import timezone
from .models import Asset
from .serializers import AssetSerializer, AssetCreateSerializer, AssetArchiveSerializer, AssetReportSerializer
from permissions import IsITAdminOrSuperAdmin

# Asset List


class AssetListView(generics.ListAPIView):
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role in ['it', 'superadmin']:
            return Asset.objects.filter(is_archived=False)

        elif user.role == 'manager':
            return Asset.objects.filter(
                assigned_to__reporting_manager__user=user,
                is_archived=False
            )
        elif user.role == 'employee':
            return Asset.objects.filter(
                assigned_to__user=user,
                is_archived=False
            )
        return Asset.objects.none()


# Asset Create
class AssetCreateView(generics.CreateAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetCreateSerializer
    permission_classes = [IsITAdminOrSuperAdmin]


# Asset Detail
class AssetDetailView(generics.RetrieveAPIView):
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role in ['it', 'superadmin']:
            return Asset.objects.filter(is_archived=False)

        elif user.role == 'manager':
            return Asset.objects.filter(
                assigned_to__reporting_manager__user=user,
                is_archived=False
            )

        elif user.role == 'employee':
            return Asset.objects.filter(
                assigned_to__user=user,
                is_archived=False
            )

        return Asset.objects.none()

# Asset Update


class AssetUpdateView(generics.UpdateAPIView):
    serializer_class = AssetCreateSerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return Asset.objects.filter(is_archived=False)


# Asset Archive
class AssetArchiveView(generics.UpdateAPIView):
    serializer_class = AssetArchiveSerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return Asset.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        serializer.save(
            is_archived=True,
            archived_at=timezone.now()
        )


# Asset Assign to the employees
class AssetAssignView(generics.UpdateAPIView):
    serializer_class = AssetCreateSerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return Asset.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        serializer.save(status='assigned')


class AssetStatusReportView(generics.ListAPIView):
    serializer_class = AssetReportSerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return Asset.objects.filter(is_archived=False)
