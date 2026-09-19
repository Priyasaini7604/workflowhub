# users/tests.py

from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from .models import User
from .views import LoginView, UserDeactivateView, UserActivateView, UserListView


class LoginViewTests(TestCase):
    """Security-critical: dual username/email login, and both wrong
    credentials and inactive accounts must be rejected."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username="loginuser",
            email="loginuser@example.com",
            password="correctpass123",
            role="employee",
        )

    def _login(self, username_or_email, password):
        request = self.factory.post(
            "/api/users/login/",
            {"username": username_or_email, "password": password},
        )
        view = LoginView.as_view()
        return view(request)

    def test_login_with_username_succeeds(self):
        response = self._login("loginuser", "correctpass123")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_with_email_succeeds(self):
        response = self._login("loginuser@example.com", "correctpass123")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_wrong_password_rejected(self):
        response = self._login("loginuser", "wrongpass")
        self.assertEqual(response.status_code, 401)

    def test_nonexistent_user_rejected(self):
        response = self._login("nobody_here", "whatever")
        self.assertEqual(response.status_code, 401)

    def test_error_message_does_not_leak_whether_user_exists(self):
        # Both a wrong password AND a nonexistent username should
        # return the exact same generic error — never reveal which
        # case it was, since that helps an attacker enumerate accounts
        wrong_pass_response = self._login("loginuser", "wrongpass")
        no_user_response = self._login("nobody_here", "whatever")
        self.assertEqual(
            wrong_pass_response.data["error"], no_user_response.data["error"]
        )

    def test_inactive_user_cannot_login(self):
        self.user.is_active = False
        self.user.save()
        response = self._login("loginuser", "correctpass123")
        self.assertEqual(response.status_code, 401)

    def test_returned_user_data_matches_logged_in_user(self):
        response = self._login("loginuser", "correctpass123")
        self.assertEqual(response.data["user"]["username"], "loginuser")
        self.assertEqual(response.data["user"]["role"], "employee")


class UserActivationTests(TestCase):
    """Deactivate/reactivate — the same pattern EmployeeArchiveView
    relies on to lock out archived employees."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.hr_user = User.objects.create_user(
            username="hr_users_app", password="test123", role="hr"
        )
        self.target_user = User.objects.create_user(
            username="target_user", password="test123",
            role="employee", is_active=True,
        )

    def test_deactivate_sets_is_active_false(self):
        request = self.factory.patch(
            f"/api/users/{self.target_user.id}/deactivate/", {}
        )
        force_authenticate(request, user=self.hr_user)
        view = UserDeactivateView.as_view()
        response = view(request, pk=self.target_user.id)

        self.assertEqual(response.status_code, 200)
        self.target_user.refresh_from_db()
        self.assertFalse(self.target_user.is_active)

    def test_activate_sets_is_active_true(self):
        self.target_user.is_active = False
        self.target_user.save()

        request = self.factory.patch(
            f"/api/users/{self.target_user.id}/activate/", {}
        )
        force_authenticate(request, user=self.hr_user)
        view = UserActivateView.as_view()
        response = view(request, pk=self.target_user.id)

        self.assertEqual(response.status_code, 200)
        self.target_user.refresh_from_db()
        self.assertTrue(self.target_user.is_active)

    def test_non_hr_cannot_deactivate_users(self):
        employee_user = User.objects.create_user(
            username="regular_emp", password="test123", role="employee"
        )
        request = self.factory.patch(
            f"/api/users/{self.target_user.id}/deactivate/", {}
        )
        force_authenticate(request, user=employee_user)
        view = UserDeactivateView.as_view()
        response = view(request, pk=self.target_user.id)

        self.assertEqual(response.status_code, 403)


class UserListViewFilterTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.hr_user = User.objects.create_user(
            username="hr_list", password="test123", role="hr"
        )
        User.objects.create_user(
            username="alice_it", email="alice@corp.com",
            password="test123", role="it",
        )
        User.objects.create_user(
            username="bob_hr", email="bob@corp.com",
            password="test123", role="hr",
        )

    def _get(self, params=""):
        request = self.factory.get(f"/api/users/{params}")
        force_authenticate(request, user=self.hr_user)
        view = UserListView.as_view()
        return view(request)

    def test_filter_by_role(self):
        response = self._get("?role=it")
        usernames = [item["username"] for item in response.data["results"]]
        self.assertEqual(usernames, ["alice_it"])

    def test_search_matches_username(self):
        response = self._get("?search=alice")
        usernames = [item["username"] for item in response.data["results"]]
        self.assertEqual(usernames, ["alice_it"])

    def test_search_matches_email(self):
        response = self._get("?search=bob@corp.com")
        usernames = [item["username"] for item in response.data["results"]]
        self.assertEqual(usernames, ["bob_hr"])
