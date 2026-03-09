// backend/src/services/actionPlan.service.js
const { prisma } = require('../config/prismaClient');

// Velocidade média: Quantos dispositivos um técnico faz por dia
const VELOCITY_PER_TECH_DAILY = 4; 

const generateActionPlan = async () => {
  // 1. Buscar Técnicos E ADMINS (Para você conseguir testar sendo Admin)
  const technicians = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'TECNICO' },
        { role: 'ADMIN' }  // <--- ISSO COLOCA VOCÊ NA LISTA!
      ]
    },
    select: { id: true, name: true, role: true }
  });

  if (technicians.length === 0) {
    return { error: "Nenhum técnico ou admin disponível para gerar o plano." };
  }

  // 2. Buscar TODOS os dispositivos que precisam de preventiva (Pendentes)
  const devices = await prisma.device.findMany({
    where: {
      isActive: true,
      OR: [
        { nextPreventiveDate: { lt: new Date() } }, // Vencidos
        { nextPreventiveDate: null },               // Nunca feitos
      ]
    },
    include: {
        sector: true // Traz o relacionamento com a tabela Sector
    },
    orderBy: [
      { sector: { name: 'asc' } }, 
      { nextPreventiveDate: { sort: 'asc', nulls: 'first' } }
    ]
  });

  // 3. Define Prioridades
  const prioritizedDevices = devices.map(d => {
    let priority = 'NORMAL';
    
    // Pega o nome do setor da relação (ou undefined se não tiver)
    const setorName = d.sector?.name;

    if (!setorName) priority = 'BAIXA'; // Sem setor = Baixa prioridade
    
    // Se estiver vencido há mais de 30 dias E tiver setor, vira ALTA
    const isLate = d.nextPreventiveDate && new Date(d.nextPreventiveDate) < new Date(new Date().setDate(new Date().getDate() - 30));
    
    if (setorName && isLate) priority = 'ALTA';

    return { 
        ...d, 
        setor: setorName, // "Achata" o nome para o frontend ler fácil
        priority 
    };
  });

  // Reordena: ALTA > NORMAL > BAIXA
  const priorityOrder = { 'ALTA': 0, 'NORMAL': 1, 'BAIXA': 2 };
  prioritizedDevices.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // 4. Distribuição (Round-Robin)
  const assignments = technicians.map(t => ({
    technicianId: t.id,
    technicianName: t.name,
    assignedDevices: []
  }));

  prioritizedDevices.forEach((device, index) => {
    const techIndex = index % technicians.length;
    assignments[techIndex].assignedDevices.push(device);
  });

  // 5. Cálculo de Metas e Estatísticas
  const totalPending = prioritizedDevices.length;
  const teamDailyCapacity = technicians.length * VELOCITY_PER_TECH_DAILY;
  const estimatedDays = Math.ceil(totalPending / teamDailyCapacity) || 1;

  return {
    success: true,
    data: {
      date: new Date(),
      stats: {
        totalPending,
        teamSize: technicians.length,
        dailyCapacityPerTech: VELOCITY_PER_TECH_DAILY,
        estimatedDaysToComplete: estimatedDays,
        estimatedMonthsToComplete: (estimatedDays / 22).toFixed(1),
        metas: {
          diaria: VELOCITY_PER_TECH_DAILY,
          semanal: VELOCITY_PER_TECH_DAILY * 5,
          mensal: VELOCITY_PER_TECH_DAILY * 20
        }
      },
      assignments
    }
  };
};

module.exports = { generateActionPlan };