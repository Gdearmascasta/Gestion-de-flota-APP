import React, { useState, useEffect } from 'react';
import { Truck, Package, Play, Activity, BarChart2, Map as MapIcon } from 'lucide-react';
import MapComponent from './components/MapComponent';
import { getVehiculos, getPedidos, createVehiculo, createPedido, deleteVehiculo, deletePedido, optimizarRutas } from './api';

function App() {
  const [vehiculos, setVehiculos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [rutas, setRutas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('gestion'); // 'gestion' | 'analisis'
  const [pickingMode, setPickingMode] = useState(null); // 'vehiculo' | 'pedido' | null
  
  const [vForm, setVForm] = useState({ id: '', capacidad: '', latitud: '', longitud: '' });
  const [pForm, setPForm] = useState({ id: '', demanda: '', latitud: '', longitud: '' });
  
  const [useConfig, setUseConfig] = useState(false);
  const [config, setConfig] = useState({
    base_km_galon: 4.0,
    penalizacion_trafico: 0.20,
    penalizacion_semaforos: 0.10,
    penalizacion_carga: 0.15
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resV, resP] = await Promise.all([getVehiculos(), getPedidos()]);
      setVehiculos(resV.data);
      setPedidos(resP.data);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  const handleMapClick = (lat, lon) => {
    if (pickingMode === 'vehiculo') {
      setVForm({...vForm, latitud: lat.toFixed(6), longitud: lon.toFixed(6)});
      setPickingMode(null);
    } else if (pickingMode === 'pedido') {
      setPForm({...pForm, latitud: lat.toFixed(6), longitud: lon.toFixed(6)});
      setPickingMode(null);
    }
  };

  const handleAddVehiculo = async (e) => {
    e.preventDefault();
    try {
      await createVehiculo({
        id: vForm.id,
        capacidad: parseInt(vForm.capacidad),
        latitud: parseFloat(vForm.latitud),
        longitud: parseFloat(vForm.longitud)
      });
      setVForm({ id: '', capacidad: '', latitud: '', longitud: '' });
      fetchData();
      setRutas(null); 
    } catch (err) {
      alert("Error agregando vehículo: " + (err.response?.data?.detail || err.message));
      console.error(err);
    }
  };

  const handleAddPedido = async (e) => {
    e.preventDefault();
    try {
      await createPedido({
        id: pForm.id,
        demanda: parseInt(pForm.demanda),
        latitud: parseFloat(pForm.latitud),
        longitud: parseFloat(pForm.longitud)
      });
      setPForm({ id: '', demanda: '', latitud: '', longitud: '' });
      fetchData();
      setRutas(null);
    } catch (err) {
      alert("Error agregando pedido: " + (err.response?.data?.detail || err.message));
      console.error(err);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const payload = useConfig ? config : {};
      const res = await optimizarRutas(payload);
      setRutas(res.data);
      setActiveTab('analisis'); // Auto switch to analysis tab
    } catch (err) {
      alert("Error optimizando: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <Activity size={24} style={{ marginRight: '10px' }} />
        <h1>Logística Avanzada | Optimización de Rutas</h1>
      </nav>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'gestion' ? 'active' : ''}`}
          onClick={() => setActiveTab('gestion')}
        >
          <MapIcon size={18} style={{verticalAlign:'text-bottom', marginRight:'5px'}}/> Gestión y Mapa
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analisis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analisis')}
        >
          <BarChart2 size={18} style={{verticalAlign:'text-bottom', marginRight:'5px'}}/> Análisis de Ruta
        </button>
      </div>
      
      <div className="main-content">
        {activeTab === 'gestion' && (
          <>
            <aside className="sidebar">
              {pickingMode && (
                <div style={{background:'#fef3c7', padding:'0.8rem', borderRadius:'6px', border:'1px solid #f59e0b', color:'#92400e', fontSize:'0.9rem'}}>
                  <strong>Modo Selección:</strong> Haz clic en cualquier lugar del mapa para asignar la coordenada al {pickingMode}.
                  <button onClick={() => setPickingMode(null)} style={{background:'none', border:'none', color:'#d97706', textDecoration:'underline', cursor:'pointer', marginLeft:'5px'}}>Cancelar</button>
                </div>
              )}
              <div className="card">
                <h3><Truck size={18} style={{verticalAlign: 'text-bottom', marginRight:'5px'}}/> Vehículos</h3>
                <form onSubmit={handleAddVehiculo}>
                  <div className="form-group">
                    <label>ID del Vehículo</label>
                    <input type="text" required value={vForm.id} onChange={e => setVForm({...vForm, id: e.target.value.toUpperCase()})} placeholder="Ej. CAM-01" />
                  </div>
                  <div className="form-group">
                    <label>Capacidad</label>
                    <input type="number" required value={vForm.capacidad} onChange={e => setVForm({...vForm, capacidad: e.target.value})} placeholder="Ej. 100" />
                  </div>
                  <div style={{display:'flex', gap:'10px', marginBottom:'0.8rem'}}>
                    <div className="form-group" style={{flex:1, marginBottom:0}}>
                      <input type="number" step="any" required value={vForm.latitud} onChange={e => setVForm({...vForm, latitud: e.target.value})} placeholder="Latitud" />
                    </div>
                    <div className="form-group" style={{flex:1, marginBottom:0}}>
                      <input type="number" step="any" required value={vForm.longitud} onChange={e => setVForm({...vForm, longitud: e.target.value})} placeholder="Longitud" />
                    </div>
                  </div>
                  <button type="button" onClick={() => setPickingMode('vehiculo')} style={{background:'#e2e8f0', color:'#334155', border:'none', padding:'0.4rem', borderRadius:'4px', marginBottom:'1rem', cursor:'pointer', width:'100%', fontSize:'0.85rem'}}>📍 Seleccionar en mapa</button>
                  <button type="submit" className="btn">Agregar Vehículo</button>
                </form>
                
                <ul className="item-list" style={{marginTop: '1rem'}}>
                  {vehiculos.map(v => (
                    <li key={v.id} className="list-item">
                      <div className="list-item-info">
                        <strong>ID: {v.id}</strong>
                        <span>Capacidad: {v.capacidad}</span>
                      </div>
                      <div className="list-item-actions">
                        <button onClick={async () => { await deleteVehiculo(v.id); fetchData(); setRutas(null); }}>✕</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <h3><Package size={18} style={{verticalAlign: 'text-bottom', marginRight:'5px'}}/> Pedidos</h3>
                <form onSubmit={handleAddPedido}>
                  <div className="form-group">
                    <label>ID del Pedido</label>
                    <input type="text" required value={pForm.id} onChange={e => setPForm({...pForm, id: e.target.value.toUpperCase()})} placeholder="Ej. PED-01" />
                  </div>
                  <div className="form-group">
                    <label>Demanda</label>
                    <input type="number" required value={pForm.demanda} onChange={e => setPForm({...pForm, demanda: e.target.value})} placeholder="Ej. 20" />
                  </div>
                  <div style={{display:'flex', gap:'10px', marginBottom:'0.8rem'}}>
                    <div className="form-group" style={{flex:1, marginBottom:0}}>
                      <input type="number" step="any" required value={pForm.latitud} onChange={e => setPForm({...pForm, latitud: e.target.value})} placeholder="Latitud" />
                    </div>
                    <div className="form-group" style={{flex:1, marginBottom:0}}>
                      <input type="number" step="any" required value={pForm.longitud} onChange={e => setPForm({...pForm, longitud: e.target.value})} placeholder="Longitud" />
                    </div>
                  </div>
                  <button type="button" onClick={() => setPickingMode('pedido')} style={{background:'#e2e8f0', color:'#334155', border:'none', padding:'0.4rem', borderRadius:'4px', marginBottom:'1rem', cursor:'pointer', width:'100%', fontSize:'0.85rem'}}>📍 Seleccionar en mapa</button>
                  <button type="submit" className="btn">Agregar Pedido</button>
                </form>
                
                <ul className="item-list" style={{marginTop: '1rem', maxHeight: '150px', overflowY: 'auto'}}>
                  {pedidos.map(p => (
                    <li key={p.id} className="list-item">
                      <div className="list-item-info">
                        <strong>ID: {p.id}</strong>
                        <span>Demanda: {p.demanda}</span>
                      </div>
                      <div className="list-item-actions">
                        <button onClick={async () => { await deletePedido(p.id); fetchData(); setRutas(null); }}>✕</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card" style={{marginBottom: '1rem'}}>
                <label style={{display: 'flex', alignItems: 'center', fontWeight: '600', color: 'var(--text)', cursor: 'pointer'}}>
                  <input type="checkbox" checked={useConfig} onChange={e => setUseConfig(e.target.checked)} style={{marginRight: '8px'}} />
                  Configuración Avanzada de Consumo
                </label>
                {useConfig && (
                  <div style={{marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    <div className="form-group">
                      <label>Rendimiento Base (km/gal)</label>
                      <input type="number" step="0.1" value={config.base_km_galon} onChange={e => setConfig({...config, base_km_galon: parseFloat(e.target.value)})} />
                    </div>
                    <div className="form-group">
                      <label>Penalización por Tráfico Alto (%)</label>
                      <input type="number" step="0.01" value={config.penalizacion_trafico * 100} onChange={e => setConfig({...config, penalizacion_trafico: parseFloat(e.target.value)/100})} />
                    </div>
                    <div className="form-group">
                      <label>Penalización por Semáforos (%)</label>
                      <input type="number" step="0.01" value={config.penalizacion_semaforos * 100} onChange={e => setConfig({...config, penalizacion_semaforos: parseFloat(e.target.value)/100})} />
                    </div>
                    <div className="form-group">
                      <label>Penalización Máxima por Carga (%)</label>
                      <input type="number" step="0.01" value={config.penalizacion_carga * 100} onChange={e => setConfig({...config, penalizacion_carga: parseFloat(e.target.value)/100})} />
                    </div>
                  </div>
                )}
              </div>

              <button 
                className="btn success" 
                onClick={handleOptimize} 
                disabled={loading || vehiculos.length === 0 || pedidos.length === 0}
                style={{padding: '1rem', fontSize: '1.1rem'}}
              >
                {loading ? <div className="loader" style={{margin: '0 auto'}}></div> : <><Play size={20} /> Optimizar Rutas</>}
              </button>
            </aside>
            <main className="map-container">
              <MapComponent vehiculos={vehiculos} pedidos={pedidos} rutas={rutas?.rutas} onMapClick={pickingMode ? handleMapClick : undefined} />
            </main>
          </>
        )}

        {activeTab === 'analisis' && (
          <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
            <div style={{height: '400px', width: '100%'}}>
              <MapComponent vehiculos={vehiculos} pedidos={pedidos} rutas={rutas?.rutas} />
            </div>
            
            <div className="analysis-table-container">
              {rutas ? (
                <>
                  <div className="stat-grid" style={{marginBottom: '1rem'}}>
                    <div className="stat-box" style={{background: 'var(--primary)', color: 'white'}}>
                      <div className="stat-value">{rutas.distancia_total.toFixed(2)} km</div>
                      <div className="stat-label">Distancia Vial Total</div>
                    </div>
                    <div className="stat-box" style={{background: 'var(--primary)', color: 'white'}}>
                      <div className="stat-value">{rutas.tiempo_estimado.toFixed(0)} min</div>
                      <div className="stat-label">Tiempo Total en Tránsito</div>
                    </div>
                    <div className="stat-box" style={{background: 'var(--primary)', color: 'white'}}>
                      <div className="stat-value">{rutas.tiempo_promedio_vehiculo.toFixed(0)} min</div>
                      <div className="stat-label">Tiempo Promedio por Vehículo</div>
                    </div>
                    <div className="stat-box" style={{background: 'var(--primary)', color: 'white'}}>
                      <div className="stat-value">{rutas.combustible_total.toFixed(2)} gal</div>
                      <div className="stat-label">Combustible Total Consumido</div>
                    </div>
                    <div className="stat-box" style={{background: 'var(--primary)', color: 'white'}}>
                      <div className="stat-value">{rutas.eficiencia_promedio.toFixed(2)} km/gal</div>
                      <div className="stat-label">Eficiencia Promedio de Flota</div>
                    </div>
                    <div className="stat-box" style={{background: 'var(--primary)', color: 'white'}}>
                      <div className="stat-value">{rutas.vehiculos_usados} / {vehiculos.length}</div>
                      <div className="stat-label">Vehículos Usados</div>
                    </div>
                  </div>

                  <div className="highlights-grid" style={{marginBottom: '2rem'}}>
                    {(() => {
                      const mostEfficient = [...rutas.rutas].sort((a,b) => b.eficiencia - a.eficiencia)[0];
                      const longestRoute = [...rutas.rutas].sort((a,b) => b.distancia - a.distancia)[0];
                      const longestTime = [...rutas.rutas].sort((a,b) => b.tiempo_ruta - a.tiempo_ruta)[0];
                      
                      return (
                        <>
                          <div className="highlight-card success">
                            <h4>Vehículo más eficiente</h4>
                            <p className="highlight-value">{mostEfficient?.vehiculo_id || 'N/A'}</p>
                            <p className="highlight-sub">{mostEfficient?.eficiencia.toFixed(2)} km/gal</p>
                          </div>
                          <div className="highlight-card warning">
                            <h4>Ruta más larga</h4>
                            <p className="highlight-value">{longestRoute?.vehiculo_id || 'N/A'}</p>
                            <p className="highlight-sub">{longestRoute?.distancia.toFixed(2)} km</p>
                          </div>
                          <div className="highlight-card danger">
                            <h4>Mayor tiempo de tránsito</h4>
                            <p className="highlight-value">{longestTime?.vehiculo_id || 'N/A'}</p>
                            <p className="highlight-sub">{longestTime?.tiempo_ruta.toFixed(0)} min</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <h3 style={{color: 'var(--text)'}}>Detalle de Rutas</h3>
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Vehículo</th>
                        <th>Carga</th>
                        <th>Distancia</th>
                        <th>Tiempo</th>
                        <th>Consumo (gal)</th>
                        <th>Eficiencia (km/gal)</th>
                        <th>Penalizaciones</th>
                        <th>Barrios Recorridos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rutas.rutas.map(r => (
                        <tr key={r.vehiculo_id}>
                          <td><strong>{r.vehiculo_id}</strong></td>
                          <td>{r.carga_total}</td>
                          <td>{r.distancia.toFixed(2)} km</td>
                          <td>{r.tiempo_ruta.toFixed(0)} min</td>
                          <td>{r.combustible_consumido.toFixed(2)}</td>
                          <td>{r.eficiencia.toFixed(2)}</td>
                          <td>
                            <div className="analysis-badges">
                              {r.factores_penalizacion && r.factores_penalizacion.length > 0 ? r.factores_penalizacion.map((f, i) => (
                                <span key={i} className="badge" style={{background:'#fef3c7', color:'#92400e'}}>{f}</span>
                              )) : <span className="badge">Ninguna</span>}
                            </div>
                          </td>
                          <td>
                            <div className="analysis-badges">
                              {r.barrios.length > 0 ? r.barrios.map((b, i) => (
                                <span key={i} className="badge">{b}</span>
                              )) : <span className="badge">N/A</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div style={{textAlign: 'center', color: '#64748b', padding: '3rem'}}>
                  <h2>Aún no se han optimizado rutas.</h2>
                  <p>Vuelve a la pestaña de Gestión, agrega vehículos/pedidos y presiona Optimizar.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
