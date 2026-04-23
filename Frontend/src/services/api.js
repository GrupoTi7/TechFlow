import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/',
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
export const updateDeviceTicketInDb = async (deviceId, ticketId) => {
  try {
    const response = await apiClient.patch(`/api/devices/${deviceId}/ticket`, { ticketId });
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar ticket no banco:", error);
    throw error.response?.data || new Error('Erro ao vincular ticket no banco.');
  }
};

export const getDeviceTicketFromDb = async (deviceId) => {
  try {
    const response = await apiClient.get(`/api/devices/${deviceId}/ticket?t=${new Date().getTime()}`);
    return response.data.ticketId;
  } catch (error) {
    return null;
  }
};

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
    const response = await apiClient.post('/api/sectors', { name, type, interval: maintenanceInterval });
    return response.data;
  } catch (error) { throw error; }
};

export const updateSector = async (id, name, type, maintenanceInterval) => {
  try {
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

export const getActionPlanData = async () => {
  try {
    const response = await apiClient.get('/api/action-plan');
    return response.data; 
  } catch (error) {
    return null; 
  }
};

export const getActionPlans = async () => {
    try {
        const response = await apiClient.get('/api/plans');
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar planos", error);
        return [];
    }
};

export const createActionPlan = async (planData) => {
    const response = await apiClient.post('/api/plans', planData);
    return response.data;
};

export const deleteActionPlan = async (id) => {
    await apiClient.delete(`/api/plans/${id}`);
    return true;
};

export const startAgideskTicket = async (deviceData) => {
    try {
        const response = await apiClient.post('/api/agidesk/start', deviceData);
        return response.data;
    } catch (error) {
        console.error("Erro na API Agidesk:", error);
        throw error.response?.data || new Error('Erro ao iniciar no Agidesk.');
    }
};

export const playAgideskTicket = async (ticketId) => {
    try {
        const response = await apiClient.post('/api/agidesk/play', { ticketId });
        return response.data;
    } catch (error) {
        console.error("Erro ao dar play no Agidesk:", error);
        throw error.response?.data || new Error('Erro ao iniciar cronômetro.');
    }
};

export const finishAgideskTicket = async (ticketId, relatorioText) => {
    try {
        const response = await apiClient.post('/api/agidesk/finish', { ticketId, relatorioText });
        return response.data;
    } catch (error) {
        console.error("Erro ao encerrar no Agidesk:", error);
        throw error.response?.data || new Error('Erro ao encerrar chamado.');
    }
};

// ==========================================
// FUNÇÕES DO MAPA DE TOPOLOGIA (REACT FLOW)
// ==========================================

export const updateDevicePosition = async (id, x, y) => {
  const response = await apiClient.put(`/api/devices/${id}/position`, { x, y });
  return response.data;
};

export const getNetworkLinks = async (context = 'matriz') => {
  const response = await apiClient.get(`/api/devices/links?context=${context}`);
  return response.data;
};

export const createNetworkLink = async (sourceId, targetId, sourceHandle, targetHandle, context = 'matriz') => {
  const response = await apiClient.post('/api/devices/links', { sourceId, targetId, sourceHandle, targetHandle, context });
  return response.data;
};

export const deleteNetworkLink = async (id) => {
  const response = await apiClient.delete(`/api/devices/links/${id}`);
  return response.data;
};

export const getMapZones = async (context = 'matriz') => {
  const response = await apiClient.get(`/api/devices/zones?context=${context}`);
  return response.data;
};

export const createMapZone = async (zoneData) => {
  const response = await apiClient.post('/api/devices/zones', zoneData);
  return response.data;
};

export const updateMapZone = async (id, zoneData) => {
  const response = await apiClient.put(`/api/devices/zones/${id}`, zoneData);
  return response.data;
};

export const deleteMapZone = async (id) => {
  const response = await apiClient.delete(`/api/devices/zones/${id}`);
  return response.data;
};

export const importZabbixData = async (zabbixData, context) => {
    try {
        const res = await apiClient.post('/api/devices/zabbix/import', { zabbixData, context });
        return res.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Erro ao importar dados do Zabbix');
    }
};

export const updateDeviceNetworkInfo = async (id, name, ipAddress, nobreakModel) => {
  const response = await apiClient.patch(`/api/devices/${id}/network`, { name, ipAddress, nobreakModel });
  return response.data;
};

export const clearTopology = async (context = 'matriz') => {
  const response = await apiClient.delete(`/api/devices/topology/clear?context=${context}`);
  return response.data;
};

export const deleteDevice = async (id) => {
  const response = await apiClient.delete(`/api/devices/${id}`);
  return response.data;
};

export const clearAllLinks = async (context = 'matriz') => {
  const response = await apiClient.delete(`/api/devices/topology/links/clear?context=${context}`);
  return response.data;
};

export const createManualDevice = async (deviceData) => {
  const response = await apiClient.post('/api/devices/manual', deviceData);
  return response.data;
};

export const pingDevices = async (ips) => {
  const response = await apiClient.post('/api/devices/ping', { ips });
  return response.data;
};

export const updateDeviceCategory = async (id, category) => {
    try {
        const res = await apiClient.patch(`/api/devices/${id}/category`, { category });
        return res.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Erro ao atualizar categoria');
    }
};

// 🟢 CORRIGIDO AQUI: apiClient em vez de api, e rota para /api/preventives
export const getHistory = async () => {
  try {
    const response = await apiClient.get('/api/preventives'); 
    return response.data;
  } catch (error) {
    console.error('Erro em getHistory:', error);
    return { success: false, message: error.message };
  }
};

export default apiClient;