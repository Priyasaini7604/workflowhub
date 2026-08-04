# notifications/tests.py

from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import User
from .models import Notification
from .utils import notify, notify_many
from .views import (
    NotificationListView,
    NotificationUpdateView,
    NotificationDeleteView,
)


class NotifyUtilTests(TestCase):
    """The notify() helper must be safe to call with recipient=None
    (e.g. an employee with no linked user) without raising."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="notif_user", password="test123", role="employee"
        )

    def test_notify_creates_notification_for_valid_recipient(self):
        result = notify(self.user, "Test Title", "Test message")
        self.assertIsNotNone(result)
        self.assertEqual(Notification.objects.count(), 1)
        notif = Notification.objects.first()
        self.assertEqual(notif.recipient, self.user)
        self.assertEqual(notif.notification_type, "general")

    def test_notify_with_none_recipient_does_nothing(self):
        result = notify(None, "Test Title", "Test message")
        self.assertIsNone(result)
        self.assertEqual(Notification.objects.count(), 0)

    def test_notify_respects_custom_notification_type(self):
        notify(self.user, "Asset assigned", "msg", notification_type="asset")
        notif = Notification.objects.first()
        self.assertEqual(notif.notification_type, "asset")


class NotifyManyUtilTests(TestCase):
    def setUp(self):
        self.hr1 = User.objects.create_user(
            username="hr1_notif", password="test123", role="hr"
        )
        self.hr2 = User.objects.create_user(
            username="hr2_notif", password="test123", role="hr"
        )

    def test_notify_many_creates_one_per_recipient(self):
        notify_many(
            User.objects.filter(role="hr"), "Task done", "msg",
            notification_type="task",
        )
        self.assertEqual(Notification.objects.count(), 2)
        recipients = set(
            Notification.objects.values_list("recipient__username", flat=True)
        )
        self.assertEqual(recipients, {"hr1_notif", "hr2_notif"})

    def test_notify_many_with_empty_list_creates_nothing(self):
        notify_many([], "Task done", "msg")
        self.assertEqual(Notification.objects.count(), 0)

    def test_notify_many_skips_none_recipients_safely(self):
        # e.g. a list built from employee.user where some employees
        # have no linked user
        notify_many([self.hr1, None, self.hr2], "msg", "body")
        self.assertEqual(Notification.objects.count(), 2)


class NotificationScopingTests(TestCase):
    """Every view here must be scoped to the requesting user's own
    notifications — this is the main thing worth testing in this app."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user1 = User.objects.create_user(
            username="notif_scope1", password="test123", role="employee"
        )
        self.user2 = User.objects.create_user(
            username="notif_scope2", password="test123", role="employee"
        )
        self.own_notif = Notification.objects.create(
            recipient=self.user1, title="Mine", message="msg",
        )
        self.other_notif = Notification.objects.create(
            recipient=self.user2, title="Not mine", message="msg",
        )

    def test_list_only_returns_own_notifications(self):
        request = self.factory.get("/api/notifications/")
        force_authenticate(request, user=self.user1)
        view = NotificationListView.as_view()
        response = view(request)

        titles = [item["title"] for item in response.data["results"]]
        self.assertEqual(titles, ["Mine"])

    def test_cannot_mark_someone_elses_notification_as_read(self):
        request = self.factory.patch(
            f"/api/notifications/{self.other_notif.id}/", {"is_read": True}
        )
        force_authenticate(request, user=self.user1)
        view = NotificationUpdateView.as_view()
        response = view(request, pk=self.other_notif.id)

        # get_queryset() scopes to request.user — other user's
        # notification is invisible, so this 404s rather than updating it
        self.assertEqual(response.status_code, 404)
        self.other_notif.refresh_from_db()
        self.assertFalse(self.other_notif.is_read)

    def test_can_mark_own_notification_as_read(self):
        request = self.factory.patch(
            f"/api/notifications/{self.own_notif.id}/", {"is_read": True}
        )
        force_authenticate(request, user=self.user1)
        view = NotificationUpdateView.as_view()
        response = view(request, pk=self.own_notif.id)

        self.assertEqual(response.status_code, 200)
        self.own_notif.refresh_from_db()
        self.assertTrue(self.own_notif.is_read)

    def test_cannot_delete_someone_elses_notification(self):
        request = self.factory.delete(
            f"/api/notifications/{self.other_notif.id}/"
        )
        force_authenticate(request, user=self.user1)
        view = NotificationDeleteView.as_view()
        response = view(request, pk=self.other_notif.id)

        self.assertEqual(response.status_code, 404)
        self.assertTrue(
            Notification.objects.filter(id=self.other_notif.id).exists()
        )

    def test_can_delete_own_notification(self):
        request = self.factory.delete(
            f"/api/notifications/{self.own_notif.id}/"
        )
        force_authenticate(request, user=self.user1)
        view = NotificationDeleteView.as_view()
        response = view(request, pk=self.own_notif.id)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(
            Notification.objects.filter(id=self.own_notif.id).exists()
        )
