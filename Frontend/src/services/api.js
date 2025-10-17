// src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
});

// Interceptor que anexa o token a todas as requisições
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Função de Login (Já existente)
export const login = async (username, password) => {
  try {
    const response = await apiClient.post('/api/auth/login', { username, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao tentar fazer login.');
  }
};

// --- ADICIONE ESTA NOVA FUNÇÃO ---
// Função para buscar todos os dispositivos (chama GET /api/devices)
export const getDevices = async () => {
  try {
    const response = await apiClient.get('/api/devices');
    return response.data; // Retorna { success: true, count: ..., devices: [...] }
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao buscar dispositivos.');
  }
};