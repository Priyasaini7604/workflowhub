from rest_framework import generics, permissions
from .models import Asset
from .serializers import AssetSerializer, AssetCreateSerializer


# Asset List — Saare assets dekhna
class AssetListView(generics.ListAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]


# Asset Create — Naya asset banana
class AssetCreateView(generics.CreateAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


# Asset Detail — Ek asset ki poori detail
class AssetDetailView(generics.RetrieveAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]


# Asset Update — Asset update karna
class AssetUpdateView(generics.UpdateAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


# Asset Delete — Asset delete karna
class AssetDeleteView(generics.DestroyAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]


# Asset Assign — Employee ko asset assign karna
class AssetAssignView(generics.UpdateAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        serializer.save(status='assigned')
