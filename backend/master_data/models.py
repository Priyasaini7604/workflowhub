from django.db import models
from django.conf import settings


class AssetCategory(models.Model):
    name = models.CharField(max_length=50, unique=True)
    # internal key, jaise 'laptop'
    code = models.SlugField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='asset_categories_created'
    )

    # soft delete pattern (tumhare existing models jaisa)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "Asset Categories"
        ordering = ['name']

    def __str__(self):
        return self.name
