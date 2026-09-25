# Imagen de producción (Railway): backend + front en un solo servicio.
# Para desarrollo local usar docker compose.
FROM python:3.13-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app.py .
COPY frontend/public ./public
RUN mkdir -p /data
ENV STATIC_DIR=/app/public DB_PATH=/data/catalogo.db
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips="*"
