const { prisma } = require('../config/prismaClient');

const generateActionPlan = async (filters = {}) => {
  // 🟢 1. Lemos TODAS as variáveis que vêm do Controller
  const { 
    name,
    startDate,
    deadline,       // A data limite (blindada contra fuso horário)
    dailyCapacity,  // A capacidade exata calculada
    targetTypes = [], 
    targetSectors = [], 
    distributeToAllTechs = true, 
    selectedTechs = [] 
  } = filters;

  // 🟢 2. FIM DO HARDCODE! 
  // Agora a velocidade é a que o utilizador escolheu (ou o Backend calculou). 
  // Se por acaso vier vazia, assumimos 1.
  const VELOCITY_PER_TECH_DAILY = dailyCapacity ? Number(dailyCapacity) : 1; 

  // =========================================================
  // FILTRO DE TÉCNICOS
  // =========================================================
  let techWhere = { OR: [ { role: 'TECNICO' }, { role: 'ADMIN' } ] };

  if (!distributeToAllTechs && selectedTechs.length > 0) {
    techWhere = { id: { in: selectedTechs } }; 
  }

  const availableTechnicians = await prisma.user.findMany({
    where: techWhere,
    select: { id: true, name: true, role: true }
  });

  if (availableTechnicians.length === 0) {
    return { error: "Nenhum técnico disponível com os filtros selecionados." };
  }

  // =========================================================
  // FILTRO DE DISPOSITIVOS (A Busca Cirúrgica)
  // =========================================================
  let deviceWhere = { isActive: true };

  if (targetTypes && targetTypes.length > 0) {
      deviceWhere.deviceType = { in: targetTypes };
  }

  if (targetSectors && targetSectors.length > 0) {
      deviceWhere.setor = { in: targetSectors }; 
  }

  const devices = await prisma.device.findMany({
    where: deviceWhere,
    include: { sector: true },
    orderBy: [
      { sector: { name: 'asc' } }, 
      { nextPreventiveDate: { sort: 'asc', nulls: 'first' } }
    ]
  });

  if (devices.length === 0) {
      const nomeTipo = targetTypes.length > 0 ? targetTypes.join(' ou ') : 'dispositivo';
      return { error: `Oba! Nenhum ${nomeTipo} pendente nos setores selecionados.` };
  }

  // =========================================================
  // PRIORIDADES E ORDENAÇÃO
  // =========================================================
  const prioritizedDevices = devices.map(d => {
    let priority = 'NORMAL';
    const setorName = d.sector?.name || d.setor;

    if (!setorName) priority = 'BAIXA'; 
    
    // Vencido há mais de 30 dias vira ALTA
    const isLate = d.nextPreventiveDate && new Date(d.nextPreventiveDate) < new Date(new Date().setDate(new Date().getDate() - 30));
    if (setorName && isLate) priority = 'ALTA';

    return { ...d, setor: setorName, priority };
  });

  const priorityOrder = { 'ALTA': 0, 'NORMAL': 1, 'BAIXA': 2 };
  prioritizedDevices.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // =========================================================
  // DISTRIBUIÇÃO
  // =========================================================
  const assignments = availableTechnicians.map(t => ({
    technicianId: t.id,
    technicianName: t.name,
    assignedDevices: []
  }));

  prioritizedDevices.forEach((device, index) => {
    const techIndex = index % availableTechnicians.length;
    assignments[techIndex].assignedDevices.push(device);
  });

  // =========================================================
  // ESTATÍSTICAS
  // =========================================================
  const totalPending = prioritizedDevices.length;
  const teamDailyCapacity = availableTechnicians.length * VELOCITY_PER_TECH_DAILY;
  const estimatedDays = Math.ceil(totalPending / teamDailyCapacity) || 1;

  // 🟢 3. O PACOTE DE DADOS PERFEITO PARA O FRONTEND
  // Adicionámos o "deadline" e "dailyCapacity" no objeto raiz e em "stats"
  // para que o Widget da Home exiba os dados imaculados.
  return {
    success: true,
    id: new Date().getTime(), // ID gerado caso não esteja a guardar no banco de dados fisicamente
    name: name || "Plano Automático",
    startDate: startDate || new Date(),
    deadline: deadline, // ❤️ A SUA DATA LIMITE AGORA VAI INTACTA!
    dailyCapacity: VELOCITY_PER_TECH_DAILY,
    assignments: assignments, // Garantia de que a home encontra os equipamentos
    data: {
      date: startDate || new Date(),
      stats: {
        totalPending,
        teamSize: availableTechnicians.length,
        dailyCapacityPerTech: VELOCITY_PER_TECH_DAILY, // Agora mostra o valor certo (ex: 1)
        estimatedDaysToComplete: estimatedDays,
        estimatedEndDate: deadline, // ❤️ Garantia dupla para o Dashboard
        dailyGoal: VELOCITY_PER_TECH_DAILY,
        metas: {
          diaria: VELOCITY_PER_TECH_DAILY,
          semanal: VELOCITY_PER_TECH_DAILY * 5
        }
      },
      assignments
    }
  };
};

module.exports = { generateActionPlan };