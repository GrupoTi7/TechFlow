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
    compliantCount, 
    ownedCount,
    rentedCount,
    preventivesLast7Days,
    preventivesLast30Days,
    preventivesLast90Days,
    // 🟢 1. BUSCAMOS EXCLUSIVAMENTE A INFRAESTRUTURA
    infraCount 
  ] = await Promise.all([
    prisma.device.count({ where: { isActive: true } }),
    prisma.device.count({ where: { isActive: true, nextPreventiveDate: { lt: today, not: null } } }),
    prisma.device.count({ where: { isActive: true, nextPreventiveDate: { gte: today, lte: thirtyDaysFromNow } } }),
    prisma.device.count({ where: { isActive: true, nextPreventiveDate: { gte: today } } }),
    prisma.device.count({ where: { isActive: true, OR: [{ name: { startsWith: 'PTR' } }, { name: { startsWith: 'TRC' } }] } }),
    prisma.device.count({ where: { isActive: true, OR: [{ name: { startsWith: 'NETSITE' } }, { name: { startsWith: 'VIVO' } }, { name: { startsWith: 'SOROCAMP' } }, { name: { startsWith: 'INFOBRAS' } }, { name: { startsWith: 'LENOVO' } }] } }),
    prisma.preventive.count({ where: { date: { gte: subDays(today, 7) } } }),
    prisma.preventive.count({ where: { date: { gte: subDays(today, 30) } } }),
    prisma.preventive.count({ where: { date: { gte: ninetyDaysAgo } } }),
    
    // 🟢 A MÁGICA: Conta apenas se for switch, ap, wifi, etc.
    prisma.device.count({
      where: {
        isActive: true,
        OR: [
          { deviceType: { contains: 'switch' } },
          { deviceType: { contains: 'ap' } },
          { deviceType: { contains: 'wifi' } },
          { deviceType: { contains: 'access point' } }
        ]
      }
    })
  ]);

  // 🟢 2. A MATEMÁTICA: O resto é computador/servidor
  const computerCount = totalDevices - infraCount;

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
    compliantCount, 
    ownedCount,
    rentedCount,
    preventiveChartData,
    computerCount, // 🟢 3. Enviamos o número de PCs para a tela
    infraCount     // 🟢 4. Enviamos o número de Infra para a tela
  };
}

module.exports = { getDashboardStats };