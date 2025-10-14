// src/services/api.js
import axios from 'axios';

// Cria uma instância do axios com a URL base da nossa API
const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // A URL do seu backend
});

// Função para fazer login
export const login = async (username, password) => {
  try {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data; // Retorna os dados da resposta (ex: { success: true, token: "..." })
  } catch (error) {
    // Lança o erro para que o componente que chamou possa tratá-lo
    throw error.response.data || new Error('Erro de rede ao tentar fazer login.');
  }
};