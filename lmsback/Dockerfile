FROM python:3.12-alpine

WORKDIR /app

# [+] Установка build-зависимостей для Alpine (если нужны compiled packages)
RUN apk add --no-cache gcc musl-dev postgresql-dev

RUN pip install uv

COPY .python-version pyproject.toml ./  
COPY uv.lock* ./  

RUN uv sync

COPY ./app .

# [+] Создание директорий для volumes
RUN mkdir -p /app/media /app/logs && \
    chmod 755 /app/media /app/logs

CMD ["uv", "run", "python", "main.py"]
