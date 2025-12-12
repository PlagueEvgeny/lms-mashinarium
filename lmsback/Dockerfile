FROM python:3.12-alpine

WORKDIR /app

RUN pip install uv


COPY .python-version pyproject.toml ./  
COPY uv.lock* ./  

RUN uv sync

COPY ./app .

CMD ["uv", "run", "python", "main.py"]
