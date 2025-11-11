// src/services/dashboard.service.js
const { prisma } = require('../config/prismaClient');
const { addDays, subDays } = require('date-fns'); 

async function getDashboardStats() {
  const now = new Date();
  
  // --- A LÓGICA DE FILTRO ATUALIZADA ---
  // Adicionámos 'isActive: true' a todas as contagens de dispositivos
  // para que os seus números do dashboard correspondam à sua lista de dispositivos.

  const [
    totalDevices,
    overdueCount,
    upcomingCount,
    ownedCount,
    rentedCount,
    preventivesLast7Days,
    preventivesLast30Days,
    preventivesLast90Days
  ] = await Promise.all([
    // Filtra apenas ativos
    prisma.device.count({ where: { isActive: true } }), 
    // Filtra apenas ativos + atrasados
    prisma.device.count({ where: { isActive: true, nextPreventiveDate: { lte: now } } }),
    // Filtra apenas ativos + próximos
    prisma.device.count({ where: { isActive: true, nextPreventiveDate: { gte: now, lte: addDays(now, 30) } } }),
    // Filtra apenas ativos + comprados
    prisma.device.count({ 
      where: { 
        isActive: true, 
        OR: [ 
          { name: { startsWith: 'PTR' } }, 
          { name: { startsWith: 'TRC' } } 
        ] 
      } 
    }),
    
    // --- ALTERAÇÃO PRINCIPAL AQUI ---
    // Filtra apenas ativos + alugados (com os novos prefixos)
    prisma.device.count({ 
      where: { 
        isActive: true, 
        OR: [ 
          { name: { startsWith: 'NETSITE' } }, 
          { name: { startsWith: 'VIVO' } },
          { name: { startsWith: 'SOROCAMP' } }, 
          { name: { startsWith: 'INFOBRAS' } },  
          { name: { startsWith: 'LENOVO' } }
        ] 
      } 
    }),
    // ---------------------------------

    prisma.preventive.count({ where: { date: { gte: subDays(now, 7) } } }),
    prisma.preventive.count({ where: { date: { gte: subDays(now, 30) } } }),
    prisma.preventive.count({ where: { date: { gte: subDays(now, 90) } } })
  ]);

  // O 'ownershipChartData' já estava correto
  const ownershipChartData = [
    { name: "Comprados (PTR, TRC)", value: ownedCount || 0, color: 'blue.6' },
    { name: "Alugados (NETSITE, VIVO, SOROCAMP, INFOBRAS)", value: rentedCount || 0, color: 'gray.6' },
  ];

  const preventiveChartData = [
    { name: "Últ. 7 dias", value: preventivesLast7Days || 0 },
    { name: "Últ. 30 dias", value: preventivesLast30Days || 0 },
    { name: "Últ. 90 dias", value: preventivesLast90Days || 0 },
  ];

  return {
    totalDevices: totalDevices || 0,
    overdueCount: overdueCount || 0,
    upcomingCount: upcomingCount || 0,
    ownedCount: ownedCount || 0,
    rentedCount: rentedCount || 0,
    ownershipChartData,
    preventiveChartData,
  };
}

module.exports = { getDashboardStats };