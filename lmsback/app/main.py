import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from api.router import main_api_router
from core.config import APP_PORT

app = FastAPI(
        title="LMS Mashinarium",
        description="Learning Management System",
        version="0.1.0"
)

# Логирование
logger.remove()
logger.add("info.log", format="Log: {time} -- {level} -- {message} -- {file}:{line} {function}",
           level="INFO", enqueue=True)

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

# Router`s
app.include_router(main_api_router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=APP_PORT)
