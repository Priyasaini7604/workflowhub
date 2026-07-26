from django.urls import path
from .views import ApprovalsCenterView

urlpatterns = [
    path('', ApprovalsCenterView.as_view(), name='approvals-center'),
]