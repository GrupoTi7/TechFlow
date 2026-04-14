const { prisma } = require('../config/prismaClient');

const VELOCITY_PER_TECH_DAILY = 4; 

const generateActionPlan = async (filters = {}) => {
  const { 
    targetTypes = [], 
    targetSectors = [], 
    distributeToAllTechs = true, 
    selectedTechs = [] 
  } = filters;

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

  // 🟢 SÓ FILTRA POR TIPO SE MANDAR ALGO
  if (targetTypes && targetTypes.length > 0) {
      deviceWhere.deviceType = { in: targetTypes };
  }

  // 🟢 SÓ FILTRA POR SETOR SE MANDAR ALGO
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

  return {
    success: true,
    data: {
      date: new Date(),
      stats: {
        totalPending,
        teamSize: availableTechnicians.length,
        dailyCapacityPerTech: VELOCITY_PER_TECH_DAILY,
        estimatedDaysToComplete: estimatedDays,
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