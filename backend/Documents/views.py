from rest_framework import generics, permissions
from django.utils import timezone
from .models import Document
from .serializers import (
    DocumentSerializer,
    DocumentCreateSerializer,
    DocumentArchiveSerializer,
    DocumentVerifySerializer,
)
from permissions import IsHROrSuperAdmin


# Document List
class DocumentListView(generics.ListAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        employee_id = self.kwargs.get('employee_id')

        # HR, SuperAdmin can see all employees documents
        if user.role in ['hr', 'superadmin']:
            return Document.objects.filter(
                employee=employee_id,
                is_archived=False
            )

        # Employee can see only own documents
        elif user.role == 'employee':
            return Document.objects.filter(
                employee__user=user,
                is_archived=False
            )

        return Document.objects.none()


# Document Upload
class DocumentCreateView(generics.CreateAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


class DocumentDetailView(generics.RetrieveAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role in ['hr', 'superadmin']:
            return Document.objects.filter(is_archived=False)

        elif user.role == 'employee':
            return Document.objects.filter(
                employee__user=user,
                is_archived=False
            )

        return Document.objects.none()


class DocumentVerifyView(generics.UpdateAPIView):
    serializer_class = DocumentVerifySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(is_archived=False)


# Document Archive
class DocumentArchiveView(generics.UpdateAPIView):
    serializer_class = DocumentArchiveSerializer
    permission_classes = [IsHROrSuperAdmin]

    def get_queryset(self):
        return Document.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        serializer.save(
            is_archived=True,
            archived_at=timezone.now()
        )
