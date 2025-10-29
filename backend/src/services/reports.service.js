// src/services/reports.service.js
const { prisma } = require('../config/prismaClient');

// Relatório 1: Conta quantas preventivas cada técnico realizou
async function getPreventivesByTechnician() {

  const data = await prisma.$queryRaw`
    SELECT \`technician\`, COUNT(*) as 'count' 
    FROM \`preventives\` -- <-- CORRIGIDO (era 'preventive')
    WHERE \`technician\` IS NOT NULL AND \`technician\` != '' 
    GROUP BY \`technician\` 
    ORDER BY \`count\` DESC;
  `;

  return data.map(item => ({
    name: item.technician,
    value: Number(item.count), 
  }));
}

// Relatório 2: Encontra os 10 dispositivos com mais manutenções
async function getTopDevicesByMaintenance() {

  const data = await prisma.$queryRaw`
    SELECT d.\`name\`, COUNT(p.\`id\`) as 'count' 
    FROM \`devices\` d -- <-- CORRIGIDO (era 'device')
    JOIN \`preventives\` p ON d.\`id\` = p.\`deviceId\` -- <-- CORRIGIDO (era 'preventive')
    GROUP BY d.\`id\`, d.\`name\` 
    ORDER BY \`count\` DESC 
    LIMIT 10;
  `;

  return data.map(item => ({
    name: item.name,
    value: Number(item.count),
  }));
}

module.exports = { 
  getPreventivesByTechnician,
  getTopDevicesByMaintenance 
};
