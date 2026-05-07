import math
import requests
import os
import osmnx as ox
import networkx as nx
from fastapi import HTTPException
from models import Vehiculo, Pedido, RutaVehiculo, OptimizacionResponse, ConfiguracionRuta

G_OSM = None

def get_osm_graph():
    global G_OSM
    if G_OSM is None:
        print("Cargando grafo de OSM para Cartagena, Colombia...")
        G_OSM = ox.graph_from_place("Cartagena, Colombia", network_type="drive")
        G_OSM = ox.add_edge_speeds(G_OSM)
        G_OSM = ox.add_edge_travel_times(G_OSM)
    return G_OSM

def obtener_barrio_nominatim(lat, lon):
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        headers = {'User-Agent': 'GestionDeFlotas/1.0'}
        r = requests.get(url, headers=headers, timeout=2)
        if r.status_code == 200:
            data = r.json()
            address = data.get('address', {})
            barrio = address.get('neighbourhood') or address.get('suburb') or address.get('city_district') or "Desconocido"
            return barrio
    except:
        pass
    return "Desconocido"

from models import Vehiculo, Pedido, RutaVehiculo, OptimizacionResponse, ConfiguracionRuta

def optimizar_rutas(vehiculos: list[Vehiculo], pedidos: list[Pedido], config: ConfiguracionRuta) -> OptimizacionResponse:
    ors_api_key = os.environ.get("ORS_API_KEY")
    if not ors_api_key or ors_api_key == "YOUR_OPENROUTESERVICE_API_KEY_HERE":
        print("Advertencia: Falta la API Key de OpenRouteService. Se usarán distancias euclidianas para la asignación.")

    # Construir lista de todos los puntos
    puntos = [(v.latitud, v.longitud) for v in vehiculos] + [(p.latitud, p.longitud) for p in pedidos]
    coords_list = [[lon, lat] for lat, lon in puntos] # ORS usa [lon, lat]
    
    # Obtener matriz de distancias usando ORS
    distancias_matrix = None
    headers = {
        'Authorization': ors_api_key,
        'Content-Type': 'application/json'
    }
    
    if ors_api_key and ors_api_key != "YOUR_OPENROUTESERVICE_API_KEY_HERE":
        try:
            url_matrix = "https://api.openrouteservice.org/v2/matrix/driving-car"
            payload = {
                "locations": coords_list,
                "metrics": ["distance"]
            }
            r = requests.post(url_matrix, json=payload, headers=headers, timeout=10)
            if r.status_code == 200:
                data = r.json()
                distancias_matrix = data.get('distances')
            else:
                print(f"Error en ORS Matrix API: {r.text}, usando distancias euclidianas")
        except Exception as e:
            print(f"Error interno consultando ORS Matrix: {str(e)}, usando distancias euclidianas")

    # Función auxiliar para distancia
    def get_dist(idx1, idx2):
        dist = 0.0
        if distancias_matrix and distancias_matrix[idx1][idx2] is not None:
            dist = distancias_matrix[idx1][idx2]
        
        if dist == 0.0 and idx1 != idx2:
            lat1, lon1 = puntos[idx1]
            lat2, lon2 = puntos[idx2]
            dx = lat1 - lat2
            dy = (lon1 - lon2) * math.cos(math.radians((lat1 + lat2) / 2))
            dist = math.sqrt(dx*dx + dy*dy) * 111000.0 # meters
            
        return dist

    rutas = []
    pedidos_pendientes = list(range(len(vehiculos), len(puntos))) # indices en la matriz
    demandas_pendientes = {i: pedidos[i - len(vehiculos)].demanda for i in pedidos_pendientes}
    
    distancia_total = 0.0
    tiempo_total = 0.0
    vehiculos_usados = 0
    combustible_total = 0.0
    
    for v_idx, v in enumerate(vehiculos):
        if not pedidos_pendientes:
            break
            
        ruta_puntos_indices = [v_idx]
        pedidos_ruta = []
        barrios_ruta = []
        capacidad_restante = v.capacidad
        carga_actual = 0
        pos_actual_idx = v_idx
        
        while pedidos_pendientes and capacidad_restante > 0:
            mejor_pedido_idx = None
            mejor_distancia = float('inf')
            mejor_lista_idx = -1
            
            for i, p_idx in enumerate(pedidos_pendientes):
                if demandas_pendientes[p_idx] > 0:
                    dist = get_dist(pos_actual_idx, p_idx)
                    if dist < mejor_distancia:
                        mejor_distancia = dist
                        mejor_pedido_idx = p_idx
                        mejor_lista_idx = i
            
            if mejor_pedido_idx is not None:
                p = pedidos[mejor_pedido_idx - len(vehiculos)]
                
                demanda_actual = demandas_pendientes[mejor_pedido_idx]
                cantidad_a_llevar = min(demanda_actual, capacidad_restante)
                
                pedidos_ruta.append(f"{p.id} ({cantidad_a_llevar}u)")
                ruta_puntos_indices.append(mejor_pedido_idx)
                
                capacidad_restante -= cantidad_a_llevar
                carga_actual += cantidad_a_llevar
                demandas_pendientes[mejor_pedido_idx] -= cantidad_a_llevar
                
                barrio = obtener_barrio_nominatim(p.latitud, p.longitud)
                barrios_ruta.append(barrio)
                
                pos_actual_idx = mejor_pedido_idx
                
                if demandas_pendientes[mejor_pedido_idx] == 0:
                    pedidos_pendientes.pop(mejor_lista_idx)
            else:
                break
                
        if pedidos_ruta:
            # Generar geometría usando OSMnx
            G = get_osm_graph()
            ruta_coordenadas = []
            dist_ruta = 0.0
            tiempo_ruta = 0.0
            
            nodes = []
            for idx in ruta_puntos_indices:
                lat, lon = puntos[idx]
                node = ox.distance.nearest_nodes(G, lon, lat)
                nodes.append(node)
                
            full_route = []
            for i in range(len(nodes)-1):
                try:
                    segment = nx.shortest_path(G, nodes[i], nodes[i+1], weight="length")
                    full_route += segment
                    dist_ruta += nx.shortest_path_length(G, nodes[i], nodes[i+1], weight="length") / 1000.0 # km
                    try:
                        tiempo_ruta += nx.shortest_path_length(G, nodes[i], nodes[i+1], weight="travel_time") / 60.0 # min
                    except:
                        dist = nx.shortest_path_length(G, nodes[i], nodes[i+1], weight="length") / 1000.0
                        tiempo_ruta += (dist / 40.0) * 60.0
                except nx.NetworkXNoPath:
                    print(f"No path found between {nodes[i]} and {nodes[i+1]}")
                    
            if full_route:
                # Convertir a [lat, lon] para Leaflet
                ruta_coordenadas = [[G.nodes[n]['y'], G.nodes[n]['x']] for n in full_route]
            else:
                # Fallback final a líneas rectas
                ruta_coordenadas = [[puntos[idx][0], puntos[idx][1]] for idx in ruta_puntos_indices]
                dist_ruta = sum(get_dist(ruta_puntos_indices[i], ruta_puntos_indices[i+1]) for i in range(len(ruta_puntos_indices)-1)) / 1000.0
                tiempo_ruta = (dist_ruta / 40.0) * 60.0

            barrios_unicos = []
            for b in barrios_ruta:
                if b not in barrios_unicos and b != "Desconocido":
                    barrios_unicos.append(b)

            # Calcular combustible basado en modelo hiperrealista
            factor_carga = (carga_actual / v.capacidad) * config.penalizacion_carga if v.capacidad > 0 else 0.0
            
            velocidad_promedio = dist_ruta / (tiempo_ruta / 60) if tiempo_ruta > 0 else 0.0
            factor_trafico = config.penalizacion_trafico if velocidad_promedio < 30.0 and dist_ruta > 0 else 0.0
            
            nodos_por_km = len(full_route) / dist_ruta if dist_ruta > 0 else 0.0
            factor_semaforos = config.penalizacion_semaforos if nodos_por_km > 15.0 else 0.0
            
            ajuste_total = 1.0 + factor_carga + factor_trafico + factor_semaforos
            rendimiento_real = config.base_km_galon / ajuste_total
            
            consumo = dist_ruta / rendimiento_real if rendimiento_real > 0 else 0.0
            eficiencia = (dist_ruta / consumo) if consumo > 0 else 0.0
            
            factores_aplicados = []
            if factor_carga > 0: factores_aplicados.append("Carga")
            if factor_trafico > 0: factores_aplicados.append("Tráfico")
            if factor_semaforos > 0: factores_aplicados.append("Semáforos")

            rutas.append(RutaVehiculo(
                vehiculo_id=v.id,
                pedidos=pedidos_ruta,
                coordenadas=ruta_coordenadas,
                distancia=dist_ruta,
                tiempo_ruta=tiempo_ruta,
                carga_total=carga_actual,
                barrios=barrios_unicos,
                combustible_consumido=consumo,
                eficiencia=eficiencia,
                factores_penalizacion=factores_aplicados
            ))
            distancia_total += dist_ruta
            tiempo_total += tiempo_ruta
            vehiculos_usados += 1
            combustible_total += consumo

    if pedidos_pendientes:
        raise HTTPException(
            status_code=400, 
            detail="La flota disponible no tiene capacidad suficiente para cumplir de forma obligatoria con la demanda de todos los pedidos."
        )

    eficiencia_promedio = (distancia_total / combustible_total) if combustible_total > 0 else 0.0
    tiempo_promedio_vehiculo = (tiempo_total / vehiculos_usados) if vehiculos_usados > 0 else 0.0

    return OptimizacionResponse(
        rutas=rutas,
        distancia_total=distancia_total,
        tiempo_estimado=tiempo_total,
        vehiculos_usados=vehiculos_usados,
        combustible_total=combustible_total,
        eficiencia_promedio=eficiencia_promedio,
        tiempo_promedio_vehiculo=tiempo_promedio_vehiculo
    )
