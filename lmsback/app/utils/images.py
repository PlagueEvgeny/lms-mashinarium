from pathlib import Path
from fastapi import UploadFile, HTTPException
import aiofiles
import uuid


ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 5


def get_upload_config(upload_dir: Path) -> dict:
    upload_dir.mkdir(parents=True, exist_ok=True)
    return {
        "upload_dir": upload_dir,
        "allowed_types": ALLOWED_TYPES,
        "max_size_mb": MAX_SIZE_MB,
    }


async def save_upload_image(file: UploadFile, upload_dir: Path) -> str:
    """
    Валидирует и сохраняет изображение.
    Возвращает URL вида /media/{папка}/{uuid}.{ext}
    """
    config = get_upload_config(upload_dir)

    if file.content_type not in config["allowed_types"]:
        raise HTTPException(
            status_code=400,
            detail=f"Недопустимый тип файла. Разрешены: {', '.join(config['allowed_types'])}"
        )

    content = await file.read()

    if len(content) > config["max_size_mb"] * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"Файл слишком большой. Максимум: {config['max_size_mb']}MB"
        )

    ext = Path(file.filename).suffix.lower()
    filename = f"{uuid.uuid4()}{ext}"
    filepath = config["upload_dir"] / filename

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    return f"/media/{upload_dir.name}/{filename}"
