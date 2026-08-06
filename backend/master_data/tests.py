# master_data/tests.py

from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import User
from .models import AssetCategory
from .views import (
    AssetCategoryListCreateView,
    AssetCategoryUpdateView,
    AssetCategoryArchiveView,
)


def make_category(**overrides):
    defaults = {'name': "Laptop", 'code': "laptop"}
    defaults.update(overrides)
    return AssetCategory.objects.create(**defaults)


class AssetCategoryCreateTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.it_user = User.objects.create_user(
            username="it_mc", password="test123", role="it"
        )

    def test_created_by_auto_set_from_request_user(self):
        request = self.factory.post(
            "/api/master-data/categories/",
            {"name": "Monitor", "code": "monitor"},
        )
        force_authenticate(request, user=self.it_user)
        view = AssetCategoryListCreateView.as_view()
        response = view(request)

        self.assertEqual(response.status_code, 201)
        category = AssetCategory.objects.get(name="Monitor")
        self.assertEqual(category.created_by, self.it_user)

    def test_created_by_cannot_be_overridden_by_client(self):
        other_user = User.objects.create_user(
            username="other_mc", password="test123", role="hr"
        )
        request = self.factory.post(
            "/api/master-data/categories/",
            {"name": "Keyboard", "code": "keyboard", "created_by": other_user.id},
        )
        force_authenticate(request, user=self.it_user)
        view = AssetCategoryListCreateView.as_view()
        response = view(request)

        self.assertEqual(response.status_code, 201)
        category = AssetCategory.objects.get(name="Keyboard")
        # created_by is read_only — must reflect the actual requester,
        # not the client-supplied value
        self.assertEqual(category.created_by, self.it_user)

    def test_duplicate_name_rejected(self):
        make_category(name="Laptop", code="laptop")
        request = self.factory.post(
            "/api/master-data/categories/",
            {"name": "Laptop", "code": "laptop-2"},
        )
        force_authenticate(request, user=self.it_user)
        view = AssetCategoryListCreateView.as_view()
        response = view(request)

        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.data)

    def test_duplicate_code_rejected(self):
        make_category(name="Laptop", code="laptop")
        request = self.factory.post(
            "/api/master-data/categories/",
            {"name": "Laptop Pro", "code": "laptop"},
        )
        force_authenticate(request, user=self.it_user)
        view = AssetCategoryListCreateView.as_view()
        response = view(request)

        self.assertEqual(response.status_code, 400)
        self.assertIn("code", response.data)


class AssetCategoryListTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.it_user = User.objects.create_user(
            username="it_mc2", password="test123", role="it"
        )
        make_category(name="Laptop", code="laptop")
        make_category(name="Monitor", code="monitor")
        make_category(name="Old Category", code="old-cat", is_archived=True)

    def test_archived_categories_excluded_from_list(self):
        request = self.factory.get("/api/master-data/categories/")
        force_authenticate(request, user=self.it_user)
        view = AssetCategoryListCreateView.as_view()
        response = view(request)

        # pagination_class = None here, so response.data is a bare list
        names = {item["name"] for item in response.data}
        self.assertEqual(names, {"Laptop", "Monitor"})


class AssetCategoryArchiveTests(TestCase):
    """Archiving must flip BOTH is_archived and is_active together —
    a category that's archived but still shows is_active=True would be
    a confusing/broken state for the AddAssetPage dropdown."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.it_user = User.objects.create_user(
            username="it_mc3", password="test123", role="it"
        )
        self.category = make_category(is_active=True)

    def test_archive_sets_both_is_archived_and_is_active(self):
        request = self.factory.patch(
            f"/api/master-data/categories/{self.category.id}/archive/", {}
        )
        force_authenticate(request, user=self.it_user)
        view = AssetCategoryArchiveView.as_view()
        response = view(request, pk=self.category.id)

        self.assertEqual(response.status_code, 200)
        self.category.refresh_from_db()
        self.assertTrue(self.category.is_archived)
        self.assertFalse(self.category.is_active)
        self.assertIsNotNone(self.category.archived_at)

    def test_archived_category_no_longer_updatable(self):
        # Archive it first
        self.category.is_archived = True
        self.category.save()

        request = self.factory.patch(
            f"/api/master-data/categories/{self.category.id}/", {
                "name": "New Name"}
        )
        force_authenticate(request, user=self.it_user)
        view = AssetCategoryUpdateView.as_view()
        response = view(request, pk=self.category.id)

        # get_queryset() excludes archived — should 404
        self.assertEqual(response.status_code, 404)
