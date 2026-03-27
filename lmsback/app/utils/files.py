from pathlib import Path
from fastapi import UploadFile, HTTPException
import aiofiles
import uuid
from typing import Set, Optional


# Настройки по умолчанию
DEFAULT_ALLOWED_TYPES = {
    # Изображения
    "image/jpeg", "image/png", "image/webp", "image/gif",
    # Документы
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    # Текст
    "text/plain",
    "text/markdown",
    # Архивы
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    # Видео
    "video/mp4",
    "video/mpeg",
    "video/webm",
    # Аудио
    "audio/mpeg",
    "audio/wav",
    "audio/webm",
}

DEFAULT_MAX_SIZE_MB = 50  # 50MB для файлов


def get_upload_config(
    upload_dir: Path,
    allowed_types: Optional[Set[str]] = None,
    max_size_mb: int = DEFAULT_MAX_SIZE_MB
) -> dict:
    """Получить конфигурацию для загрузки"""
    upload_dir.mkdir(parents=True, exist_ok=True)
    return {
        "upload_dir": upload_dir,
        "allowed_types": allowed_types or DEFAULT_ALLOWED_TYPES,
        "max_size_mb": max_size_mb,
    }


async def save_upload_file(
    file: UploadFile,
    upload_dir: Path,
    base_url: str,
    allowed_types: Optional[Set[str]] = None,
    max_size_mb: int = DEFAULT_MAX_SIZE_MB
) -> str:
    """
    Валидирует и сохраняет файл.
    
    Args:
        file: Загружаемый файл
        upload_dir: Директория для сохранения
        base_url: Базовый URL для формирования ссылки
        allowed_types: Разрешенные MIME-типы (опционально)
        max_size_mb: Максимальный размер в MB
    
    Returns:
        URL сохраненного файла
    """
    config = get_upload_config(upload_dir, allowed_types, max_size_mb)

    # Проверка типа файла
    if file.content_type not in config["allowed_types"]:
        raise HTTPException(
            status_code=400,
            detail=f"Недопустимый тип файла. Разрешены: {', '.join(config['allowed_types'])}"
        )

    # Проверка размера
    content = await file.read()
    if len(content) > config["max_size_mb"] * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"Файл слишком большой. Максимум: {config['max_size_mb']}MB"
        )

    # Генерация имени файла
    original_name = Path(file.filename).stem
    ext = Path(file.filename).suffix.lower()
    # Очищаем имя файла от недопустимых символов
    safe_name = "".join(c for c in original_name if c.isalnum() or c in "._- ")
    filename = f"{safe_name}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = config["upload_dir"] / filename

    # Сохранение файла
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    # Возвращаем URL
    return f"{base_url}/media/{upload_dir.name}/{filename}"


async def save_multiple_files(
    files: list[UploadFile],
    upload_dir: Path,
    base_url: str,
    allowed_types: Optional[Set[str]] = None,
    max_size_mb: int = DEFAULT_MAX_SIZE_MB
) -> list[str]:
    """
    Сохраняет несколько файлов.
    
    Returns:
        Список URL сохраненных файлов
    """
    urls = []
    for file in files:
        url = await save_upload_file(
            file=file,
            upload_dir=upload_dir,
            base_url=base_url,
            allowed_types=allowed_types,
            max_size_mb=max_size_mb
        )
        urls.append(url)
    return urls


async def delete_upload_file(file_url: str, base_path: Path) -> bool:
    """
    Удаляет файл по URL.
    
    Args:
        file_url: URL файла (например, /media/uploads/file.jpg)
        base_path: Базовая директория для медиафайлов
    
    Returns:
        True если файл удален, False если не найден
    """
    # Извлекаем путь из URL
    # Пример URL: http://localhost:8000/media/uploads/file.jpg
    # Или: /media/uploads/file.jpg
    if "://" in file_url:
        # Полный URL, берем путь после домена
        path_part = "/".join(file_url.split("/")[3:])
    else:
        # Относительный URL
        path_part = file_url.lstrip("/")
    
    if not path_part.startswith("media/"):
        return False
    
    # Получаем путь к файлу
    relative_path = path_part.replace("media/", "", 1)
    file_path = base_path / relative_path
    
    # Удаляем файл
    if file_path.exists() and file_path.is_file():
        file_path.unlink()
        return True
    
    return False
