// src/services/dashboard.service.js
const { prisma } = require('../config/prismaClient');
const { startOfDay, addDays, subDays, format } = require('date-fns');

async function getDashboardStats() {
  const today = startOfDay(new Date());
  const thirtyDaysFromNow = addDays(today, 30);

  // 1. Total de Ativos
  const totalDevices = await prisma.device.count({
    where: { isActive: true }
  });

  // 2. Alerta Crítico (Vencidos)
  const overdueCount = await prisma.device.count({
    where: {
      isActive: true,
      nextPreventiveDate: {
        lt: today,     // Menor que hoje
        not: null      // Tem que ter data definida
      }
    }
  });

  // 3. Atenção (Próximos 30 dias)
  const upcomingCount = await prisma.device.count({
    where: {
      isActive: true,
      nextPreventiveDate: {
        gte: today,            // Maior ou igual a hoje
        lte: thirtyDaysFromNow, // Menor que 30 dias
        not: null
      }
    }
  });

  // 4. EM CONFORMIDADE (A Lógica Nova)
  // Conta APENAS os que têm data agendada para daqui a mais de 30 dias.
  const compliantCount = await prisma.device.count({
    where: {
      isActive: true,
      nextPreventiveDate: {
        gt: thirtyDaysFromNow // Maior que 30 dias
      }
    }
  });

  // 5. Dados do Gráfico (Agrupado por Mês para o Chart.js)
  const ninetyDaysAgo = subDays(today, 90);
  const preventives = await prisma.preventive.findMany({
    where: { date: { gte: ninetyDaysAgo } },
    orderBy: { date: 'asc' }
  });

  const preventiveChartData = preventives.reduce((acc, curr) => {
    const month = format(new Date(curr.date), 'MM/yyyy');
    const existing = acc.find(i => i.name === month);
    if (existing) existing.value += 1;
    else acc.push({ name: month, value: 1 });
    return acc;
  }, []);

  // 6. Contagens de Nomenclatura (Com os seus filtros específicos)
  const ownedCount = await prisma.device.count({
    where: {
      isActive: true,
      OR: [
        { name: { startsWith: 'PTR' } },
        { name: { startsWith: 'TRC' } }
      ]
    }
  });

  const rentedCount = await prisma.device.count({
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
  });

  return {
    totalDevices,
    overdueCount,
    upcomingCount,
    compliantCount, // <-- O valor correto agora
    ownedCount,
    rentedCount,
    preventiveChartData // <-- Formato correto para o gráfico
  };
}

module.exports = { getDashboardStats };