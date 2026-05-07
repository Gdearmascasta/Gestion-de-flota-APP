from pydantic import BaseModel
from typing import List, Optional

class VehiculoBase(BaseModel):
    id: str
    capacidad: int
    latitud: float
    longitud: float

class Vehiculo(VehiculoBase):
    pass

class PedidoBase(BaseModel):
    id: str
    demanda: int
    latitud: float
    longitud: float

class Pedido(PedidoBase):
    pass

class ConfiguracionRuta(BaseModel):
    base_km_galon: float = 4.0
    penalizacion_trafico: float = 0.20
    penalizacion_semaforos: float = 0.10
    penalizacion_carga: float = 0.15

class RutaVehiculo(BaseModel):
    vehiculo_id: str
    pedidos: List[str]
    coordenadas: List[List[float]] # [[lat, lng], [lat, lng]]
    distancia: float # km
    tiempo_ruta: float # min
    carga_total: int
    barrios: List[str] = []
    combustible_consumido: float
    eficiencia: float
    factores_penalizacion: List[str] = []

class OptimizacionResponse(BaseModel):
    rutas: List[RutaVehiculo]
    distancia_total: float
    tiempo_estimado: float # min
    vehiculos_usados: int
    combustible_total: float
    eficiencia_promedio: float
    tiempo_promedio_vehiculo: float
