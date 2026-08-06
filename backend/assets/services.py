import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
from django.conf import settings
from django.utils import timezone


def generate_qr_for_asset(asset):
    scan_url = f"{settings.FRONTEND_BASE_URL}/scan/{asset.asset_id}"

    qr_img = qrcode.make(scan_url)

    buffer = BytesIO()
    qr_img.save(buffer, format='PNG')

    filename = f"{asset.asset_id}_qr.png"
    asset.qr_code_image.save(
        filename, ContentFile(
            buffer.getvalue()), save=False)
    asset.qr_generated_at = timezone.now()
    asset.save(update_fields=['qr_code_image', 'qr_generated_at'])

    return asset
