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
  let totalDevicesEligible = 0; // 🟢 Novo contador: Só máquinas sujeitas a preventiva
  let overdueCount = 0;
  let upcomingCount = 0;
  let compliantCount = 0;
  let withoutDataCount = 0; // 🟢 Novo contador: Máquinas sem ciclo/dados definidos

  let infraCount = 0;
  let serverCount = 0;
  let computerCount = 0;

  let ownedCount = 0;
  let rentedCount = 0;

  // 3. O Loop Mestre (Imune a maiúsculas/minúsculas e à prova de falhas)
  for (const d of allActiveDevices) {
      const name = (d.name || '').toUpperCase();
      const type = (d.deviceType || '').toUpperCase();
      const serial = (d.serial || '').toUpperCase();

      // B. É Infraestrutura?
      const isInfra = ['SWITCH', 'AP', 'WIFI', 'ACCESS POINT'].some(t => type.includes(t));

      // C. É Servidor?
      const isServer = 
          name.includes('SRV') || name.includes('VMWARE') || name.includes('SERVIDOR') ||
          type.includes('SERVER') || type.includes('SERVIDOR') || type.includes('VMWARE') ||
          serial.includes('VMWARE');

      // D. A TRIAGEM FINAL
      if (isInfra) {
          infraCount++;
      } else if (isServer) {
          serverCount++; 
      } else {
          // 🟢 SE NÃO É INFRA NEM SERVIDOR, ENTÃO É ELEGÍVEL PARA PREVENTIVA
          computerCount++; 
          totalDevicesEligible++; // 🟢 Engrossa a conta real do Dashboard

          // A. Status das Preventivas (Cálculo apenas para máquinas elegíveis)
          if (d.nextPreventiveDate) {
              const nextDate = new Date(d.nextPreventiveDate);
              nextDate.setHours(0,0,0,0);
              
              if (nextDate < today) overdueCount++;
              else if (nextDate >= today && nextDate <= thirtyDaysFromNow) upcomingCount++;
              else compliantCount++;
          } else {
              // Se não tem data de próxima preventiva, cai no limbo "sem dados"
              withoutDataCount++;
          }

          // Contagem de propriedade
          if (name.startsWith('PTR') || name.startsWith('TRC')) {
              ownedCount++;
          // 🟢 ADICIONADO O PREFIXO 'CMAQ' AQUI NA LISTA DE ALUGADOS!
          } else if (['NETSITE', 'VIVO', 'SOROCAMP', 'INFOBRAS', 'LENOVO', 'CMAQ'].some(p => name.startsWith(p))) {
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
    totalDevices: totalDevicesEligible, // 🟢 Manda para a tela APENAS as máquinas elegíveis (aprox 300)
    overdueCount,
    upcomingCount,
    compliantCount,
    withoutDataCount, // 🟢 Caso o seu frontend queira exibir isso no gráfico de rosca
    ownedCount,        
    rentedCount,       
    preventiveChartData,
    computerCount,     
    infraCount 
  };
}

module.exports = { getDashboardStats };