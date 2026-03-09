// src/services/reports.service.js
const { prisma } = require('../config/prismaClient');

// Relatório 1: Conta quantas preventivas cada técnico realizou
async function getPreventivesByTechnician() {
  const data = await prisma.$queryRaw`
    SELECT technician, COUNT(*) as count 
    FROM preventives 
    WHERE technician IS NOT NULL AND technician != '' 
    GROUP BY technician 
    ORDER BY count DESC;
  `;

  return data.map(item => ({
    name: item.technician,
    value: Number(item.count), 
  }));
}

// Relatório 2: Encontra os 10 dispositivos com mais manutenções
async function getTopDevicesByMaintenance() {
  const data = await prisma.$queryRaw`
    SELECT d.name, COUNT(p.id) as count 
    FROM devices d 
    JOIN preventives p ON d.id = p.deviceId 
    GROUP BY d.id, d.name 
    ORDER BY count DESC 
    LIMIT 10;
  `;

  return data.map(item => ({
    name: item.name,
    value: Number(item.count),
  }));
}

// Relatório 3: [NOVO] Quantidade de dispositivos por Setor
async function getDevicesBySector() {
  const data = await prisma.$queryRaw`
    SELECT s.name, COUNT(d.id) as count
    FROM devices d
    LEFT JOIN sectors s ON d.sectorId = s.id
    GROUP BY s.name
    ORDER BY count DESC;
  `;

  return data.map(item => ({
    name: item.name || 'Sem Setor',
    value: Number(item.count),
  }));
}

// Relatório 4: [NOVO] Status (Lógica via JavaScript)
async function getComplianceStatus() {
  // 1. Busca todos os dispositivos com o setor incluso
  const devices = await prisma.device.findMany({
    include: {
      sector: true 
    }
  });

  let emDia = 0;
  let vencidos = 0;
  let semDados = 0;
  
  const hoje = new Date();

  // 2. Itera para calcular as datas
  devices.forEach(device => {
    if (!device.lastPreventiveDate) {
      semDados++;
      return; 
    }

    const ultimaData = new Date(device.lastPreventiveDate);
    // Usa intervalo do setor ou padrão de 30 dias
    const intervaloDias = device.sector?.maintenanceInterval || 30;
    
    const dataVencimento = new Date(ultimaData);
    dataVencimento.setDate(ultimaData.getDate() + intervaloDias);

    if (dataVencimento < hoje) {
      vencidos++;
    } else {
      emDia++;
    }
  });

  return [
    { name: 'Em Dia', value: emDia, color: '#40c057' },
    { name: 'Vencidos', value: vencidos, color: '#fa5252' },
    { name: 'Nunca Realizado', value: semDados, color: '#fab005' }
  ];
}

// [NOVO] Relatório 5: Histórico de Manutenções (Últimos 6 meses)
async function getMaintenanceHistory() {
  // MySQL Query para agrupar por Mês/Ano (YYYY-MM)
  const data = await prisma.$queryRaw`
    SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count
    FROM preventives
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY month
    ORDER BY month ASC;
  `;

  // Formata para ficar bonito no gráfico (Ex: "2025-10" -> "Out/2025")
  const formatted = data.map(item => {
    const [year, month] = item.month.split('-');
    const date = new Date(year, month - 1);
    return {
      name: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }), // Ex: out. de 2025
      value: Number(item.count)
    };
  });

  return formatted;
}


// --- IMPORTANTE: EXPORTAR TODAS AS 4 FUNÇÕES AQUI ---
module.exports = { 
  getPreventivesByTechnician,
  getTopDevicesByMaintenance,
  getDevicesBySector,  // <--- Se faltar aqui, dá o erro "is not a function"
  getComplianceStatus, // <--- Se faltar aqui, dá o erro "is not a function"
  getMaintenanceHistory
};