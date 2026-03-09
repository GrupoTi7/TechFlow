import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================
// --- AUTENTICAÇÃO ---
// ============================================================
export const login = async (username, password) => {
  try {
    const response = await apiClient.post('/api/auth/login', { username, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao tentar fazer login.');
  }
};

export const requestPasswordReset = async (email) => {
  try {
    const response = await apiClient.post('/api/auth/request-reset', { email });
    return response.data;
  } catch (error) { 
    throw error.response?.data || new Error('Erro ao solicitar redefinição.'); 
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await apiClient.post('/api/auth/reset-password', { token, newPassword });
    return response.data;
  } catch (error) { 
    throw error.response?.data || new Error('Erro ao redefinir senha.'); 
  }
};

// ============================================================
// --- USUÁRIOS (TÉCNICOS) ---
// ============================================================
export const getUsers = async () => {
  try {
    const response = await apiClient.get('/api/users');
    return response.data.users ? response.data : { users: response.data };
  } catch (error) {
    console.error("Erro API Users:", error);
    return { users: [] };
  }
};

// ============================================================
// --- DADOS GERAIS (DASHBOARD E RELATÓRIOS) ---
// ============================================================
export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/api/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao buscar estatísticas.');
  }
};

export const getTechnicianReport = async () => {
  try {
    const response = await apiClient.get('/api/reports/by-technician');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar relatório de técnicos.');
  }
};

export const getTopDevicesReport = async () => {
  try {
    const response = await apiClient.get('/api/reports/top-devices');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar relatório top 10.');
  }
};

export const getSectorReport = async () => {
  try {
    const response = await apiClient.get('/api/reports/by-sector');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar relatório de setores.');
  }
};

export const getStatusReport = async () => {
  try {
    const response = await apiClient.get('/api/reports/status');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar status de conformidade.');
  }
};

export const getHistoryReport = async () => {
  try {
    const response = await apiClient.get('/api/reports/history');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro ao buscar histórico.');
  }
};

// ============================================================
// --- DISPOSITIVOS ---
// ============================================================
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

export const updateDeviceSetor = async (deviceId, setor, interval) => {
  try {
    const response = await apiClient.patch(`/api/devices/${deviceId}/setor`, { setor, interval });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao atualizar setor.');
  }
};

export const bulkUpdateSetors = async (updates) => {
  try {
    const response = await apiClient.patch('/api/devices/bulk-setor', { updates });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Erro de rede ao atualizar setores em massa.');
  }
};

// ============================================================
// --- PREVENTIVAS ---
// ============================================================
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

// ============================================================
// --- SETORES ---
// ============================================================
export const getSectors = async () => {
  try {
    const response = await apiClient.get('/api/sectors');
    return Array.isArray(response.data) ? response.data : (response.data.sectors || []);
  } catch (error) {
    console.error("Erro ao buscar setores", error);
    return [];
  }
};

export const createSector = async (name, type, maintenanceInterval) => {
  try {
    // 🟢 CORREÇÃO: Passando 'maintenanceInterval' para a propriedade 'interval' que o backend espera
    const response = await apiClient.post('/api/sectors', { name, type, interval: maintenanceInterval });
    return response.data;
  } catch (error) { throw error; }
};

export const updateSector = async (id, name, type, maintenanceInterval) => {
  try {
    // 🟢 CORREÇÃO: Mesma coisa aqui na atualização
    const response = await apiClient.put(`/api/sectors/${id}`, { name, type, interval: maintenanceInterval });
    return response.data;
  } catch (error) { throw error; }
};

export const deleteSector = async (id) => {
  try {
    await apiClient.delete(`/api/sectors/${id}`);
    return true;
  } catch (error) { throw error; }
};

// ============================================================
// --- TIPOS DE DISPOSITIVO ---
// ============================================================
export const getDeviceTypes = async () => {
  try {
    const response = await apiClient.get('/api/device-types');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar tipos", error);
    return [];
  }
};

export const createDeviceType = async (name, key, icon) => {
  const response = await apiClient.post('/api/device-types', { name, key, icon });
  return response.data;
};

export const updateDeviceType = async (id, name, key, icon) => {
  const response = await apiClient.put(`/api/device-types/${id}`, { name, key, icon });
  return response.data;
};

export const deleteDeviceType = async (id) => {
  await apiClient.delete(`/api/device-types/${id}`);
  return true;
};

// ============================================================
// --- PLANOS DE AÇÃO ---
// ============================================================

// 1. Para o Widget da Home (Busca o plano do usuário)
export const getActionPlanData = async () => {
  try {
    const response = await apiClient.get('/api/action-plan');
    // Retorna direto os dados para o Widget ler "data.name" corretamente
    return response.data; 
  } catch (error) {
    console.error("Erro ao buscar plano na API:", error);
    // Retorna null para o front não quebrar e mostrar o estado "Vazio"
    return null; 
  }
};

// 2. Para a Tela de Gerenciamento (Lista todos os planos)
export const getActionPlans = async () => {
    try {
        const response = await apiClient.get('/api/plans');
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar planos", error);
        return [];
    }
};

// 3. Criar novo plano
export const createActionPlan = async (planData) => {
    // planData deve conter: { name, startDate, deadline, technicians, filters, autoCalculate }
    const response = await apiClient.post('/api/plans', planData);
    return response.data;
};

// 4. Deletar plano
export const deleteActionPlan = async (id) => {
    await apiClient.delete(`/api/plans/${id}`);
    return true;
};

export const startAgideskTicket = async (deviceId) => {
    try {
        const response = await apiClient.post('/api/agidesk/start-ticket', { deviceId });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Erro ao iniciar no Agidesk.');
    }
};

export default apiClient;