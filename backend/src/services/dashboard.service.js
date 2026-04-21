const { prisma } = require('../config/prismaClient');
const { startOfDay, addDays, subDays, format } = require('date-fns');

async function getDashboardStats() {
  const today = startOfDay(new Date());
  const thirtyDaysFromNow = addDays(today, 30);
  const ninetyDaysAgo = subDays(today, 90);

  // 1. Buscas rápidas: Trazemos todas as máquinas ativas para a memória
  const [allActiveDevices, preventivesList] = await Promise.all([
    prisma.device.findMany({ where: { isActive: true } }),
    prisma.preventive.findMany({
        where: { date: { gte: ninetyDaysAgo } },
        orderBy: { date: 'asc' }
    })
  ]);

  // 2. Variáveis de contagem
  let totalDevices = allActiveDevices.length;
  let overdueCount = 0;
  let upcomingCount = 0;
  let compliantCount = 0;

  let infraCount = 0;
  let serverCount = 0;
  let computerCount = 0;

  let ownedCount = 0;
  let rentedCount = 0;

  // 3. O Loop Mestre (Imune a maiúsculas/minúsculas e à prova de falhas)
  for (const d of allActiveDevices) {
      // Força tudo para maiúsculas para o filtro não falhar nunca mais
      const name = (d.name || '').toUpperCase();
      const type = (d.deviceType || '').toUpperCase();
      const serial = (d.serial || '').toUpperCase();

      // A. Status das Preventivas
      if (d.nextPreventiveDate) {
          const nextDate = new Date(d.nextPreventiveDate);
          nextDate.setHours(0,0,0,0);
          if (nextDate < today) overdueCount++;
          else if (nextDate >= today && nextDate <= thirtyDaysFromNow) upcomingCount++;
          else compliantCount++;
      }

      // B. É Infraestrutura?
      const isInfra = ['SWITCH', 'AP', 'WIFI', 'ACCESS POINT'].some(t => type.includes(t));

      // C. É Servidor? (Procura no nome, no tipo e no serial)
      const isServer = 
          name.includes('SRV') || name.includes('VMWARE') || name.includes('SERVIDOR') ||
          type.includes('SERVER') || type.includes('SERVIDOR') || type.includes('VMWARE') ||
          serial.includes('VMWARE');

      // D. A TRIAGEM FINAL
      if (isInfra) {
          infraCount++;
      } else if (isServer) {
          serverCount++; // Foi apanhado na malha! Não entra nas contas de utilizadores.
      } else {
          // Se não é infra nem servidor, ENTÃO é Estação de Trabalho!
          computerCount++; 

          // Só contamos como "Comprado" ou "Alugado" se for Estação de Trabalho
          if (name.startsWith('PTR') || name.startsWith('TRC')) {
              ownedCount++;
          } else if (['NETSITE', 'VIVO', 'SOROCAMP', 'INFOBRAS', 'LENOVO'].some(p => name.startsWith(p))) {
              rentedCount++;
          }
      }
  }

  // 4. Gráfico de Preventivas
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
    ownedCount,        // Limpo, sem servidores!
    rentedCount,       // Limpo, sem servidores!
    preventiveChartData,
    computerCount,     // Limpo, sem servidores!
    infraCount 
  };
}

module.exports = { getDashboardStats };