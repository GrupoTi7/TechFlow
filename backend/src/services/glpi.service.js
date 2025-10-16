// src/services/glpi.service.js
const axios = require('axios');

class GLPIService {
  constructor() {
    this.baseURL = process.env.GLPI_API_URL;
    this.appToken = process.env.GLPI_APP_TOKEN;
    this.userToken = process.env.GLPI_USER_TOKEN;
    this.sessionToken = null;
  }

  async initSession() {
    try {
      if (!this.baseURL || !this.appToken || !this.userToken) {
        throw new Error('Variáveis de ambiente do GLPI não configuradas.');
      }
      const response = await axios.get(`${this.baseURL}/initSession`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `user_token ${this.userToken}`,
          'App-Token': this.appToken,
        },
      });
      this.sessionToken = response.data.session_token;
      console.log('Sessão com GLPI iniciada com sucesso.');
    } catch (error) {
      const errorMessage = error.response?.data?.[1] || error.message;
      console.error('Erro na autenticação GLPI:', errorMessage);
      throw new Error('Falha na autenticação com GLPI.');
    }
  }

  async killSession() {
    if (!this.sessionToken) return;
    try {
      await axios.get(`${this.baseURL}/killSession`, {
        headers: {
          'Content-Type': 'application/json',
          'Session-Token': this.sessionToken,
          'App-Token': this.appToken,
        },
      });
      console.log('Sessão GLPI encerrada.');
    } catch (error) {
      console.error('Erro ao encerrar sessão GLPI:', error.message);
    }
  }

  async fetchAllDevices() {
    if (!this.sessionToken) {
      await this.initSession();
    }

    const computerPromise = axios.get(`${this.baseURL}/Computer`, { headers: { 'Session-Token': this.sessionToken, 'App-Token': this.appToken }, params: { is_deleted: 0, range: '0-9999' } });
    const printerPromise = axios.get(`${this.baseURL}/Printer`, { headers: { 'Session-Token': this.sessionToken, 'App-Token': this.appToken }, params: { is_deleted: 0, range: '0-9999' } });

    const [computersResponse, printersResponse] = await Promise.all([computerPromise, printerPromise]);

    console.log(`Encontrados ${computersResponse.data.length} computadores e ${printersResponse.data.length} impressoras no GLPI.`);

    const allDevices = [];
    computersResponse.data.forEach(item => allDevices.push({ ...item, deviceType: 'computer' }));
    printersResponse.data.forEach(item => allDevices.push({ ...item, deviceType: 'printer' }));

    return allDevices;
  }
}

module.exports = new GLPIService();