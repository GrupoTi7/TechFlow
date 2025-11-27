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
    // --- A CONTAGEM QUE VOCÊ QUER ---
    compliantCount, 
    // --------------------------------
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
      where: { isActive: true, nextPreventiveDate: { lt: today, not: null } } 
    }),

    // 3. Atenção (Hoje até 30 dias)
    prisma.device.count({ 
      where: { isActive: true, nextPreventiveDate: { gte: today, lte: thirtyDaysFromNow } } 
    }),
    
    // 4. EM CONFORMIDADE (Corrigido)
    // Conta TODOS os dispositivos que têm uma data válida de hoje em diante.
    // Ou seja: Não estão vencidos e têm preventiva cadastrada.
    prisma.device.count({ 
      where: { 
        isActive: true, 
        nextPreventiveDate: { gte: today } // Maior ou igual a hoje
      } 
    }),

    // ... (Filtros de Nomenclatura - Mantidos)
    prisma.device.count({ where: { isActive: true, OR: [{ name: { startsWith: 'PTR' } }, { name: { startsWith: 'TRC' } }] } }),
    prisma.device.count({ where: { isActive: true, OR: [{ name: { startsWith: 'NETSITE' } }, { name: { startsWith: 'VIVO' } }, { name: { startsWith: 'SOROCAMP' } }, { name: { startsWith: 'INFOBRAS' } }, { name: { startsWith: 'LENOVO' } }] } }),

    // ... (Dados do Gráfico - Mantidos)
    prisma.preventive.count({ where: { date: { gte: subDays(today, 7) } } }),
    prisma.preventive.count({ where: { date: { gte: subDays(today, 30) } } }),
    prisma.preventive.count({ where: { date: { gte: ninetyDaysAgo } } })
  ]);

  // Formatação do gráfico
  const preventivesList = await prisma.preventive.findMany({
      where: { date: { gte: ninetyDaysAgo } },
      orderBy: { date: 'asc' }
  });
  const preventiveChartData = preventivesList.reduce((acc, curr) => {
      const month = format(new Date(curr.date), 'MM/yyyy');
      const existing = acc.find(i => i.name === month);
      if (existing) existing.value += 1; else acc.push({ name: month, value: 1 });
      return acc;
  }, []);

  return {
    totalDevices,
    overdueCount,
    upcomingCount,
    compliantCount, // <-- O Backend agora envia este número
    ownedCount,
    rentedCount,
    preventiveChartData,
  };
}

module.exports = { getDashboardStats };