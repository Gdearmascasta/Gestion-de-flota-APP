# Gestión de Flotas y Optimización de Rutas

Aplicación full-stack para gestionar vehículos y pedidos logísticos, con cálculo automático y optimización de rutas de entrega usando el algoritmo de Vecino Más Cercano (Nearest Neighbor).

## Características

- **Gestión de Flota:** Crea, edita y elimina vehículos con capacidades específicas.
- **Gestión de Pedidos:** Registra ubicaciones de entrega y su demanda.
- **Optimización de Rutas:** Algoritmo heurístico que asigna pedidos a vehículos respetando la capacidad y minimizando la distancia.
- **Visualización en Mapa:** Integración con Leaflet para ver ubicaciones y rutas trazadas.

## Estructura del Proyecto

- `/backend`: API construida con Python y FastAPI.
- `/frontend`: Aplicación SPA construida con React y Vite.

## Ejecución Local

### Prerrequisitos

- Python 3.9+
- Node.js 18+

### Backend

1. Abre una terminal en la carpeta `backend/`.
2. Opcional: crea un entorno virtual (`python -m venv venv` y actívalo).
3. Instala dependencias: `pip install -r requirements.txt`.
4. Ejecuta el servidor: `python main.py` o `uvicorn main:app --reload`.
5. La API estará disponible en `http://localhost:8000`. Puedes ver la documentación en `/docs`.

### Frontend

1. Abre una terminal en la carpeta `frontend/`.
2. Instala dependencias: `npm install`.
3. Ejecuta en modo desarrollo: `npm run dev`.
4. Abre `http://localhost:5173` en tu navegador.


