# audit/tests.py

from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import User
from .models import AuditLog
from .views import AuditLogListView, RecordAuditLogView


def make_log(**overrides):
    defaults = {
        'action': 'update',
        'model_name': 'Asset',
        'object_id': 1,
        'description': 'Something happened',
    }
    defaults.update(overrides)
    return AuditLog.objects.create(**defaults)


class RecordAuditLogViewPermissionTests(TestCase):
    """This endpoint exists specifically so employees/managers/IT can't
    browse the general audit trail — only hr/superadmin, and only ever
    scoped to an exact model_name + object_id__in filter."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.hr_user = User.objects.create_user(
            username="hr_audit", password="test123", role="hr"
        )
        self.superadmin_user = User.objects.create_user(
            username="sa_audit", password="test123", role="superadmin"
        )
        self.employee_user = User.objects.create_user(
            username="emp_audit", password="test123", role="employee"
        )
        self.it_user = User.objects.create_user(
            username="it_audit", password="test123", role="it"
        )

        make_log(model_name="Asset", object_id=1, description="log A")
        make_log(model_name="Asset", object_id=2, description="log B")
        make_log(model_name="Employee", object_id=1, description="log C")

    def _get(self, user, params=""):
        request = self.factory.get(f"/api/audit/record/{params}")
        force_authenticate(request, user=user)
        view = RecordAuditLogView.as_view()
        return view(request)

    def test_employee_gets_no_data_even_with_valid_filters(self):
        response = self._get(
            self.employee_user, "?model_name=Asset&object_id__in=1,2"
        )
        self.assertEqual(len(response.data["results"]), 0)

    def test_it_gets_no_data_even_with_valid_filters(self):
        response = self._get(
            self.it_user, "?model_name=Asset&object_id__in=1,2"
        )
        self.assertEqual(len(response.data["results"]), 0)

    def test_hr_gets_data_with_valid_filters(self):
        response = self._get(
            self.hr_user, "?model_name=Asset&object_id__in=1,2"
        )
        self.assertEqual(len(response.data["results"]), 2)

    def test_superadmin_gets_data_with_valid_filters(self):
        response = self._get(
            self.superadmin_user, "?model_name=Asset&object_id__in=1,2"
        )
        self.assertEqual(len(response.data["results"]), 2)

    def test_hr_gets_nothing_without_model_name(self):
        response = self._get(self.hr_user, "?object_id__in=1,2")
        self.assertEqual(len(response.data["results"]), 0)

    def test_hr_gets_nothing_without_object_ids(self):
        response = self._get(self.hr_user, "?model_name=Asset")
        self.assertEqual(len(response.data["results"]), 0)

    def test_hr_gets_nothing_with_no_params_at_all(self):
        # This is the key "no general browsing" guarantee — even hr/superadmin
        # can't get an unfiltered dump from this endpoint
        response = self._get(self.hr_user)
        self.assertEqual(len(response.data["results"]), 0)

    def test_non_digit_object_ids_are_filtered_out(self):
        response = self._get(
            self.hr_user, "?model_name=Asset&object_id__in=1,abc,2,xyz"
        )
        ids = {item["object_id"] for item in response.data["results"]}
        self.assertEqual(ids, {1, 2})

    def test_scoping_excludes_other_models(self):
        response = self._get(
            self.hr_user, "?model_name=Employee&object_id__in=1,2"
        )
        model_names = {item["model_name"] for item in response.data["results"]}
        self.assertEqual(model_names, {"Employee"})
        # only object_id=1 exists
        self.assertEqual(len(response.data["results"]), 1)


class AuditLogListViewFilterTests(TestCase):
    """General browsing endpoint (SuperAdmin-only) — search/action/
    model_name+object_id__in filters."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.superadmin_user = User.objects.create_user(
            username="sa_audit2", password="test123", role="superadmin"
        )
        self.hr_user = User.objects.create_user(
            username="hr_audit2", password="test123", role="hr"
        )
        self.actor = User.objects.create_user(
            username="alice_actor", password="test123", role="hr"
        )

        make_log(
            action="create", model_name="Employee", object_id=1,
            description="Employee created", user=self.actor,
        )
        make_log(
            action="update", model_name="Asset", object_id=1,
            description="Asset updated", user=self.actor,
        )
        make_log(
            action="delete", model_name="Asset", object_id=2,
            description="Asset archived",
        )

    def _get(self, user, params=""):
        request = self.factory.get(f"/api/audit/{params}")
        force_authenticate(request, user=user)
        view = AuditLogListView.as_view()
        return view(request)

    def test_non_superadmin_cannot_access(self):
        response = self._get(self.hr_user)
        self.assertEqual(response.status_code, 403)

    def test_superadmin_sees_all_logs_unfiltered(self):
        response = self._get(self.superadmin_user)
        self.assertEqual(len(response.data["results"]), 3)

    def test_filter_by_action(self):
        response = self._get(self.superadmin_user, "?action=delete")
        descriptions = [
            item["description"] for item in response.data["results"]
        ]
        self.assertEqual(descriptions, ["Asset archived"])

    def test_search_matches_model_name(self):
        response = self._get(self.superadmin_user, "?search=Employee")
        self.assertEqual(len(response.data["results"]), 1)

    def test_search_matches_username(self):
        response = self._get(self.superadmin_user, "?search=alice_actor")
        self.assertEqual(len(response.data["results"]), 2)

    def test_search_matches_description(self):
        response = self._get(self.superadmin_user, "?search=archived")
        self.assertEqual(len(response.data["results"]), 1)

    def test_scoped_model_name_and_object_id_filter(self):
        response = self._get(
            self.superadmin_user, "?model_name=Asset&object_id__in=1"
        )
        descriptions = [
            item["description"] for item in response.data["results"]
        ]
        self.assertEqual(descriptions, ["Asset updated"])
