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
    rawOwnedCount, // Contagem bruta (ainda inclui servidores)
    rawRentedCount, // Contagem bruta (ainda inclui servidores)
    preventivesLast7Days,
    preventivesLast30Days,
    preventivesLast90Days,
    infraCount,
    
    // 🟢 1. O FILTRO DE SERVIDORES: Conta quantos servidores existem na base
    serverCount,
    
    // 🟢 2. SERVIDORES COMPRADOS: Para remover da caixinha de "Comprados"
    serverOwnedCount,
    
    // 🟢 3. SERVIDORES ALUGADOS: Para remover da caixinha de "Alugados"
    serverRentedCount

  ] = await Promise.all([
    prisma.device.count({ where: { isActive: true } }),
    prisma.device.count({ where: { isActive: true, nextPreventiveDate: { lt: today, not: null } } }),
    prisma.device.count({ where: { isActive: true, nextPreventiveDate: { gte: today, lte: thirtyDaysFromNow } } }),
    prisma.device.count({ where: { isActive: true, nextPreventiveDate: { gte: today } } }),
    
    // Contagem de Nomenclatura Padrão
    prisma.device.count({ where: { isActive: true, OR: [{ name: { startsWith: 'PTR' } }, { name: { startsWith: 'TRC' } }] } }),
    prisma.device.count({ where: { isActive: true, OR: [{ name: { startsWith: 'NETSITE' } }, { name: { startsWith: 'VIVO' } }, { name: { startsWith: 'SOROCAMP' } }, { name: { startsWith: 'INFOBRAS' } }, { name: { startsWith: 'LENOVO' } }] } }),
    
    // Preventivas
    prisma.preventive.count({ where: { date: { gte: subDays(today, 7) } } }),
    prisma.preventive.count({ where: { date: { gte: subDays(today, 30) } } }),
    prisma.preventive.count({ where: { date: { gte: ninetyDaysAgo } } }),
    
    // Filtro Infra
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
    }),

    // 🟢 A CAÇA AOS SERVIDORES
    prisma.device.count({
        where: {
          isActive: true,
          OR: [
            { name: { contains: 'SRV' } },
            { name: { contains: 'VMware' } },
            { name: { contains: 'Servidor' } },
            { deviceType: { contains: 'server' } }
          ]
        }
    }),

    prisma.device.count({
        where: {
          isActive: true,
          OR: [
            { name: { contains: 'SRV' } },
            { name: { contains: 'VMware' } },
            { name: { contains: 'Servidor' } }
          ],
          AND: {
              OR: [{ name: { startsWith: 'PTR' } }, { name: { startsWith: 'TRC' } }]
          }
        }
    }),

    prisma.device.count({
        where: {
          isActive: true,
          OR: [
            { name: { contains: 'SRV' } },
            { name: { contains: 'VMware' } },
            { name: { contains: 'Servidor' } }
          ],
          AND: {
              OR: [{ name: { startsWith: 'NETSITE' } }, { name: { startsWith: 'VIVO' } }, { name: { startsWith: 'SOROCAMP' } }, { name: { startsWith: 'INFOBRAS' } }, { name: { startsWith: 'LENOVO' } }]
          }
        }
    })
  ]);

  // 🟢 A MATEMÁTICA LIMPA: Removemos infraestrutura E servidores da contagem de utilizadores finais.
  const computerCount = Math.max(0, totalDevices - infraCount - serverCount);
  
  // Limpamos os servidores das contagens de propriedade
  const ownedCount = Math.max(0, rawOwnedCount - serverOwnedCount);
  const rentedCount = Math.max(0, rawRentedCount - serverRentedCount);

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
    ownedCount,        // 🟢 Número já filtrado sem servidores
    rentedCount,       // 🟢 Número já filtrado sem servidores
    preventiveChartData,
    computerCount,     // 🟢 Número já filtrado sem servidores
    infraCount 
  };
}

module.exports = { getDashboardStats };