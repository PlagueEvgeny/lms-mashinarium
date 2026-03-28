from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from api.router import main_api_router
from core.config import APP_PORT
from fastapi.staticfiles import StaticFiles

app = FastAPI(
        title="LMS Mashinarium",
        description="Learning Management System",
        version="0.1.0"
)

# Логирование (каталог logs/ — в Docker монтируется томом)
LOG_DIR = Path("logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)
logger.remove()
logger.add(
    LOG_DIR / "info.log",
    format="Log: {time} -- {level} -- {message} -- {file}:{line} {function}",
    level="INFO",
    enqueue=True,
)

# Настройка CORS
origins = [
    "localhost:3000",
    "localhost:5000",
    "localhost:8081"
]

app.add_middleware(
    # Запрещаем сначала все 
    CORSMiddleware,
    # Разрешаем необходимое
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Media
app.mount("/media", StaticFiles(directory="media"), name="media")

# Router`s
app.include_router(main_api_router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=APP_PORT)
