import aiofiles
import json
import os
import tempfile
import zipfile
from pathlib import Path


def is_path_safe(base_path: str, file_path: str) -> bool:
    """Validate a file path is within the base directory to prevent path traversal."""
    try:
        # Resolve both paths
        base = Path(base_path).resolve()
        target = Path(file_path).resolve()

        # Check if target is within base directory
        try:
            target.relative_to(base)
        except ValueError:
            return False

        return True
    except Exception:
        return False


async def create_zip_export(
    json_data: str,
    user_id: str,
    base_upload_path: str
) -> bytes:
    """Create a ZIP file containing JSON data and all media files."""
    # Parse JSON to get file paths
    data = json.loads(json_data)

    # Resolve the base upload path once
    base_path = Path(base_upload_path).resolve()

    # Create temp directory for ZIP
    with tempfile.TemporaryDirectory() as temp_dir:
        zip_path = os.path.join(temp_dir, 'export.zip')

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add data.json
            zipf.writestr('data.json', json_data)

            # Collect all file paths from applications and rounds
            file_paths = set()

            for app in data.get('applications', []):
                if app.get('cv_path'):
                    cv_path = Path(app['cv_path'])
                    # Validate path is safe before using it
                    if cv_path.exists() and is_path_safe(str(base_path), str(cv_path)):
                        file_paths.add((cv_path, f'files/applications/cv_{app["id"]}{cv_path.suffix}'))

                for round_data in app.get('rounds', []):
                    for media in round_data.get('media', []):
                        if media.get('path'):
                            media_path = Path(media['path'])
                            # Validate path is safe before using it
                            if media_path.exists() and is_path_safe(str(base_path), str(media_path)):
                                file_paths.add((media_path, f'files/rounds/{round_data["id"]}_{media["type"]}{media_path.suffix}'))

            # Add files to ZIP
            for source_path, zip_name in file_paths:
                if source_path.exists():
                    zipf.write(source_path, zip_name)

        # Read ZIP file
        async with aiofiles.open(zip_path, 'rb') as f:
            zip_bytes = await f.read()

        return zip_bytes
