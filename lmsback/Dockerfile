FROM python:3.12-alpine

# Устанавливаем uv
RUN pip install uv


WORKDIR /docker_lmsback 

# Copy dependency files
COPY .python-version pyproject.toml uv.lock* alembic.ini ./

# Copy application code
COPY . .

# Создаём __init__.py, если нет (иногда помогает при сборке)
RUN touch app/__init__.py

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
