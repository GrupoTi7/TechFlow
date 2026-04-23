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

// 🟢 CORRIGIDO: Relatório 3: Quantidade de dispositivos por Setor
// Agora lê o campo de texto 'setor' direto do dispositivo e agrupa os vazios em 'Sem Setor'
async function getDevicesBySector() {
  const data = await prisma.$queryRaw`
    SELECT 
      CASE 
        WHEN setor IS NULL OR TRIM(setor) = '' THEN 'Sem Setor / N/D'
        ELSE setor 
      END as name, 
      COUNT(id) as count
    FROM devices
    GROUP BY name
    ORDER BY count DESC;
  `;

  return data.map(item => ({
    name: item.name,
    value: Number(item.count),
  }));
}

// 🟢 CORRIGIDO: Relatório 4: Status (Compliance)
// Agora usa o 'nextPreventiveDate' real e as mesmas 4 categorias exatas da HomePage
async function getComplianceStatus() {
  // Busca apenas a data do próximo agendamento para ficar ultra-rápido
  const devices = await prisma.device.findMany({
    select: { nextPreventiveDate: true }
  });

  let emDia = 0;
  let atencao = 0;
  let vencidos = 0;
  let semAgendamento = 0;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 dias

  devices.forEach(device => {
    if (!device.nextPreventiveDate) {
      semAgendamento++;
    } else {
      const nextDate = new Date(device.nextPreventiveDate);
      nextDate.setHours(0, 0, 0, 0);
      
      if (nextDate < now) {
          vencidos++;
      } else if (nextDate <= limit) {
          atencao++;
      } else {
          emDia++;
      }
    }
  });

  // Retorna já com as cores padronizadas do sistema
  return [
    { name: 'Em Dia', value: emDia, color: '#05a828' },
    { name: 'Atenção (30 dias)', value: atencao, color: '#f76707' },
    { name: 'Vencidos', value: vencidos, color: '#d90429' },
    { name: 'Sem Agend.', value: semAgendamento, color: '#495057' }
  ].filter(x => x.value > 0); // Oculta categorias que estejam zeradas
}

// 🟢 MELHORIA: Relatório 5: Histórico de Manutenções (Últimos 6 meses)
// Alterado para usar a 'date' (Data real da manutenção) em vez da 'createdAt' (Data em que foi digitada no sistema)
async function getMaintenanceHistory() {
  const data = await prisma.$queryRaw`
    SELECT DATE_FORMAT(date, '%Y-%m') as month, COUNT(*) as count
    FROM preventives
    WHERE date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY month
    ORDER BY month ASC;
  `;

  const formatted = data.map(item => {
    const [year, month] = item.month.split('-');
    // Importante: No JavaScript o mês começa do zero (0 = Janeiro)
    const dateObj = new Date(year, parseInt(month) - 1);
    
    // Devolve formatado (ex: "out. de 2025" ou "10/2025" consoante o gosto. Mantivemos MM/YYYY para bater com a Home)
    const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
    return {
      name: `${monthStr}/${year}`, 
      value: Number(item.count)
    };
  });

  return formatted;
}


// --- EXPORTAR TODAS AS FUNÇÕES ---
module.exports = { 
  getPreventivesByTechnician,
  getTopDevicesByMaintenance,
  getDevicesBySector,  
  getComplianceStatus, 
  getMaintenanceHistory
};