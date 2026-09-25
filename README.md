# choppRock

Catálogo online de Chopp & Rock Records. El admin sube el Excel mensual de la disquería, los clientes entran con un código, arman su pedido y consultan la cotización por WhatsApp.

## Levantar

```
cp .env.example .env   # cambiar CLIENT_CODE, ADMIN_PASSWORD y PORT
docker compose up -d --build
```

- Tienda: `http://localhost:$PORT`
- Admin: `http://localhost:$PORT/admin`

## Estructura

- `backend/`: FastAPI + SQLite (solo el catálogo y el código de acceso). Corre con `--reload`.
- `frontend/`: nginx sirve `public/` y le pasa `/api` al backend.

Las tapas se buscan en Deezer desde el navegador del cliente; no se guardan en el servidor.
