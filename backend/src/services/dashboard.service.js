// src/services/dashboard.service.js
const { prisma } = require('../config/prismaClient');
const { startOfDay, addDays, subDays, format } = require('date-fns');

async function getDashboardStats() {
  const today = startOfDay(new Date());
  const thirtyDaysFromNow = addDays(today, 30);
  const ninetyDaysAgo = subDays(today, 90);

  const [
    totalDevices,
    overdueCount,
    upcomingCount,
    // --- CONFORMIDADE ---
    compliantCount, 
    // --------------------
    ownedCount,
    rentedCount,
    preventivesLast7Days,
    preventivesLast30Days,
    preventivesLast90Days
  ] = await Promise.all([
    // 1. Total
    prisma.device.count({ where: { isActive: true } }),

    // 2. Vencidos (Data < Hoje)
    prisma.device.count({ 
      where: { 
        isActive: true, 
        nextPreventiveDate: { lt: today, not: null } 
      } 
    }),

    // 3. Atenção (Apenas informativo: Próximos 30 dias)
    prisma.device.count({ 
      where: { 
        isActive: true, 
        nextPreventiveDate: { gte: today, lte: thirtyDaysFromNow, not: null } 
      } 
    }),
    
    // --- 4. LÓGICA CORRIGIDA: EM CONFORMIDADE ---
    // Simplesmente: Tem data E a data é Hoje ou Futuro.
    // Não importa se é daqui a 1 dia ou 1 ano. Se não venceu, está conforme.
    prisma.device.count({ 
      where: { 
        isActive: true, 
        nextPreventiveDate: { gte: today } // Maior ou igual a hoje
      } 
    }),
    // -------------------------------------------

    // Filtros de Nomenclatura...
    prisma.device.count({ where: { isActive: true, OR: [{ name: { startsWith: 'PTR' } }, { name: { startsWith: 'TRC' } }] } }),
    prisma.device.count({ where: { isActive: true, OR: [{ name: { startsWith: 'NETSITE' } }, { name: { startsWith: 'VIVO' } }, { name: { startsWith: 'SOROCAMP' } }, { name: { startsWith: 'INFOBRAS' } }, { name: { startsWith: 'LENOVO' } }] } }),

    // Dados do Gráfico...
    prisma.preventive.count({ where: { date: { gte: subDays(today, 7) } } }),
    prisma.preventive.count({ where: { date: { gte: subDays(today, 30) } } }),
    prisma.preventive.count({ where: { date: { gte: ninetyDaysAgo } } })
  ]);

  // (Código do gráfico e retorno mantidos iguais...)
  const preventivesList = await prisma.preventive.findMany({
      where: { date: { gte: ninetyDaysAgo } },
      orderBy: { date: 'asc' }
  });

  const preventiveChartData = preventivesList.reduce((acc, curr) => {
      const month = format(new Date(curr.date), 'MM/yyyy');
      const existing = acc.find(i => i.name === month);
      if (existing) existing.value += 1;
      else acc.push({ name: month, value: 1 });
      return acc;
  }, []);

  const ownershipChartData = [
    { name: "Comprados", value: ownedCount || 0, color: 'blue.6' },
    { name: "Alugados", value: rentedCount || 0, color: 'gray.6' },
  ];

  return {
    totalDevices: totalDevices || 0,
    overdueCount: overdueCount || 0,
    upcomingCount: upcomingCount || 0,
    compliantCount: compliantCount || 0, // Valor corrigido
    ownedCount: ownedCount || 0,
    rentedCount: rentedCount || 0,
    ownershipChartData,
    preventiveChartData,
  };
}

module.exports = { getDashboardStats };