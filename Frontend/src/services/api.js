// src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (username, password) => {
  try {
    const response = await apiClient.post('/api/auth/login', { username, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao tentar fazer login.');
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/api/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao buscar estatísticas.');
  }
};

export const getDevices = async (filters = {}) => {
  try {
    // Constrói os parâmetros de query a partir do objeto de filtros
    const params = new URLSearchParams();
    if (filters.deviceType) params.append('deviceType', filters.deviceType);
    if (filters.status) params.append('status', filters.status);
    if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);
    if (filters.nomenclature) params.append('nomenclature', filters.nomenclature); // <-- ADICIONA O NOVO FILTRO

    // Faz a chamada GET com os parâmetros
    const response = await apiClient.get('/api/devices', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao buscar dispositivos.');
  }
};

export const getDeviceById = async (id) => {
  try {
    const response = await apiClient.get(`/api/devices/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao buscar o dispositivo.');
  }
};

export const getPreventivesForDevice = async (deviceId) => {
  try {
    const response = await apiClient.get(`/api/devices/${deviceId}/preventives`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao buscar preventivas.');
  }
};

export const createPreventive = async (deviceId, preventiveData) => {
  try {
    const response = await apiClient.post(`/api/devices/${deviceId}/preventives`, preventiveData);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao criar preventiva.');
  }
};