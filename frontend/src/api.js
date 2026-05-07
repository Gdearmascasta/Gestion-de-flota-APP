import axios from 'axios';

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

export const getVehiculos = () => api.get('/vehiculos');
export const createVehiculo = (data) => api.post('/vehiculos', data);
export const deleteVehiculo = (id) => api.delete(`/vehiculos/${id}`);

export const getPedidos = () => api.get('/pedidos');
export const createPedido = (data) => api.post('/pedidos', data);
export const deletePedido = (id) => api.delete(`/pedidos/${id}`);

export const optimizarRutas = (config) => api.post('/optimizar', config || {});

export default api;
