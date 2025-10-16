// test-glpi-connection.js
const axios = require('axios');

// PREENCHA COM OS SEUS DADOS REAIS DO .ENV
const GLPI_URL = "http://10.20.2.75:8089/apirest.php";
const USER_TOKEN = "m74J6Fgpix045nW9WtkNFBg2vuA1I2QtpYQ4qbcc";
const APP_TOKEN = "WppVASQmaDdBmRIQ68kmxvg77XVd0ZaswQImNN12";

async function testConnection() {
  console.log("Iniciando teste de conexão isolado com o GLPI via Axios...");
  try {
    const response = await axios.get(`${GLPI_URL}/initSession`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `user_token ${USER_TOKEN}`,
        'App-Token': APP_TOKEN,
      },
      // Adicionamos um timeout de 15 segundos para não esperar para sempre
      timeout: 15000 
    });
    console.log("✅ SUCESSO! Conexão bem-sucedida!");
    console.log("Resposta do GLPI:", response.data);
  } catch (error) {
    console.error("❌ ERRO ao conectar com o GLPI:");
    if (error.code === 'ECONNABORTED') {
      console.error("A requisição excedeu o tempo limite (timeout). O servidor GLPI não respondeu a tempo.");
    } else if (error.response) {
      console.error("O servidor GLPI respondeu com um erro:", error.response.status, error.response.data);
    } else {
      console.error("Ocorreu um erro de rede ou de configuração:", error.message);
    }
  }
}

testConnection();