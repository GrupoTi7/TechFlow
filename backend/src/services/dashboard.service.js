// src/services/dashboard.service.js
const { prisma } = require('../config/prismaClient');
const { addDays } = require('date-fns'); // Usamos para calcular "próximos 30 dias"

async function getDashboardStats() {
  const now = new Date();
  const thirtyDaysFromNow = addDays(now, 30);

  // 1. Contar dispositivos com preventivas atrasadas
  const overdueCount = await prisma.device.count({
    where: {
      nextPreventiveDate: {
        lte: now // "Less than or equal to" (menor ou igual a) agora
      }
    }
  });

  // 2. Contar preventivas agendadas para os próximos 30 dias
  const upcomingCount = await prisma.device.count({
    where: {
      nextPreventiveDate: {
        gte: now, // "Greater than or equal to" (maior ou igual a) agora
        lte: thirtyDaysFromNow // E menor ou igual a 30 dias no futuro
      }
    }
  });

  // 3. Contar o total de dispositivos
  const totalDevices = await prisma.device.count();

  // 4. Contar o total de preventivas já realizadas
  const totalPreventivesDone = await prisma.preventive.count();

  return {
    totalDevices,
    overdueCount,
    upcomingCount,
    totalPreventivesDone,
  };
}

module.exports = { getDashboardStats };