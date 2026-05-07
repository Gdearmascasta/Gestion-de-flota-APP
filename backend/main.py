from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import Vehiculo, VehiculoBase, Pedido, PedidoBase, OptimizacionResponse, ConfiguracionRuta
from optimization import optimizar_rutas
import uuid
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Logistics Optimization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
db_vehiculos = {}
db_pedidos = {}

@app.get("/api/vehiculos", response_model=list[Vehiculo])
def get_vehiculos():
    return list(db_vehiculos.values())

@app.post("/api/vehiculos", response_model=Vehiculo)
def create_vehiculo(vehiculo: VehiculoBase):
    vid = vehiculo.id
    if vid in db_vehiculos:
        raise HTTPException(status_code=400, detail=f"El vehículo con ID {vid} ya existe")
    nuevo = Vehiculo(**vehiculo.model_dump())
    db_vehiculos[vid] = nuevo
    return nuevo

@app.put("/api/vehiculos/{vid}", response_model=Vehiculo)
def update_vehiculo(vid: str, vehiculo: VehiculoBase):
    if vid not in db_vehiculos:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    actualizado = Vehiculo(id=vid, **vehiculo.model_dump())
    db_vehiculos[vid] = actualizado
    return actualizado

@app.delete("/api/vehiculos/{vid}")
def delete_vehiculo(vid: str):
    if vid in db_vehiculos:
        del db_vehiculos[vid]
        return {"status": "ok"}
    raise HTTPException(status_code=404, detail="Vehículo no encontrado")

@app.get("/api/pedidos", response_model=list[Pedido])
def get_pedidos():
    return list(db_pedidos.values())

@app.post("/api/pedidos", response_model=Pedido)
def create_pedido(pedido: PedidoBase):
    pid = pedido.id
    if pid in db_pedidos:
        raise HTTPException(status_code=400, detail=f"El pedido con ID {pid} ya existe")
    nuevo = Pedido(**pedido.model_dump())
    db_pedidos[pid] = nuevo
    return nuevo

@app.put("/api/pedidos/{pid}", response_model=Pedido)
def update_pedido(pid: str, pedido: PedidoBase):
    if pid not in db_pedidos:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    actualizado = Pedido(id=pid, **pedido.model_dump())
    db_pedidos[pid] = actualizado
    return actualizado

@app.delete("/api/pedidos/{pid}")
def delete_pedido(pid: str):
    if pid in db_pedidos:
        del db_pedidos[pid]
        return {"status": "ok"}
    raise HTTPException(status_code=404, detail="Pedido no encontrado")

from models import Vehiculo, VehiculoBase, Pedido, PedidoBase, OptimizacionResponse, ConfiguracionRuta

@app.post("/api/optimizar", response_model=OptimizacionResponse)
def optimizar(config: ConfiguracionRuta = ConfiguracionRuta()):
    vehiculos = list(db_vehiculos.values())
    pedidos = list(db_pedidos.values())
    
    if not vehiculos:
        raise HTTPException(status_code=400, detail="No hay vehículos disponibles para asignar")
    if not pedidos:
        raise HTTPException(status_code=400, detail="No hay pedidos para optimizar")
        
    resultado = optimizar_rutas(vehiculos, pedidos, config)
    return resultado

# For local testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
