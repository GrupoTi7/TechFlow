// src/services/dashboard.service.js
const { prisma } = require('../config/prismaClient');
const { addDays, subDays } = require('date-fns'); 

async function getDashboardStats() {
  const now = new Date();
  
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
    prisma.device.count(),
    prisma.device.count({ where: { nextPreventiveDate: { lte: now } } }),
    prisma.device.count({ where: { nextPreventiveDate: { gte: now, lte: addDays(now, 30) } } }),
    prisma.device.count({ where: { OR: [ { name: { startsWith: 'PTR' } }, { name: { startsWith: 'TRC' } } ] } }),
    prisma.device.count({ where: { OR: [ { name: { startsWith: 'NETSITE' } }, { name: { startsWith: 'VIVO' } } ] } }),
    prisma.preventive.count({ where: { date: { gte: subDays(now, 7) } } }),
    prisma.preventive.count({ where: { date: { gte: subDays(now, 30) } } }),
    prisma.preventive.count({ where: { date: { gte: subDays(now, 90) } } })
  ]);

  const ownershipChartData = [
    { name: "Comprados (PTR, TRC)", value: ownedCount || 0, color: 'blue.6' },
    { name: "Alugados (NETSITE, VIVO)", value: rentedCount || 0, color: 'gray.6' },
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