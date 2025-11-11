// src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Busca o relatório de preventivas por técnico
export const getTechnicianReport = async () => {
  try {
    const response = await apiClient.get('/api/reports/by-technician');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao buscar relatório de técnicos.');
  }
};

// Busca o relatório de dispositivos com mais manutenções
export const getTopDevicesReport = async () => {
  try {
    const response = await apiClient.get('/api/reports/top-devices');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao buscar relatório top 10.');
  }
};

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

// Não aceita mais filtros, apenas busca todos os dispositivos
export const getDevices = async () => {
  try {
    const response = await apiClient.get('/api/devices');
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

export const deletePreventive = async (preventiveId) => {
  try {
    const response = await apiClient.delete(`/api/preventives/${preventiveId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao apagar preventiva.');
  }
};

export const updateDeviceSetor = async (deviceId, setor, interval) => {
  try {
    const response = await apiClient.put(`/api/devices/${deviceId}/setor`, { setor, interval });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao atualizar setor.');
  }
};
export const bulkUpdateSetors = async (updates) => {
  try {
    // O 'data' é um objeto { updates: [...] }
    const response = await apiClient.patch('/api/devices/bulk-setor', { updates });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao atualizar setores em massa.');
  }
};