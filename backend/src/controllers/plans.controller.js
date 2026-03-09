// src/controllers/plans.controller.js
const { prisma } = require('../config/prismaClient');

// ==================================================================================
// FUNÇÕES MATEMÁTICAS (DIAS ÚTEIS E FERIADOS NACIONAIS)
// ==================================================================================
const fixedHolidays = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'];

function addBusinessDays(startDate, daysToAdd) {
    if (daysToAdd <= 0) return new Date(startDate);
    let currentDate = new Date(startDate);
    let addedDays = 0;
    
    while (addedDays < daysToAdd) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay(); // 0 = Dom, 6 = Sáb
        const monthDay = String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !fixedHolidays.includes(monthDay)) {
            addedDays++;
        }
    }
    return currentDate;
}

function countBusinessDays(startDate, endDate) {
    if (!startDate || !endDate) return 1;
    let count = 0;
    let currentDate = new Date(startDate);
    let end = new Date(endDate);
    currentDate.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    if (currentDate > end) return 1;

    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        const monthDay = String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !fixedHolidays.includes(monthDay)) count++;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return count === 0 ? 1 : count;
}

// ==================================================================================
// 1. LISTAR TODOS OS PLANOS
// ==================================================================================
const listPlans = async (req, res) => {
  try {
    const plans = await prisma.actionPlan.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { assignments: true } } }
    });

    const formatted = await Promise.all(plans.map(async (p) => {
       const techs = await prisma.actionPlanAssignment.findMany({
          where: { planId: p.id },
          select: { technicianId: true },
          distinct: ['technicianId']
       });
       return { ...p, technicianCount: techs.length };
    }));

    res.json(formatted);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================================================================================
// 2. CRIAR PLANO (LÓGICA EXATA DA REGRA DE NEGÓCIO)
// ==================================================================================
const createPlan = async (req, res) => {
  const { 
      name, startDate, dailyCapacity,
      allDevices, selectedSectors, selectedTypes,
      allTechnicians, selectedTechnicians 
  } = req.body;

  try {
    let techIds = [];
    if (allTechnicians) {
        const users = await prisma.user.findMany({ where: { role: { not: 'ADMIN' } }, select: { id: true } });
        techIds = users.map(u => u.id);
    } else {
        techIds = selectedTechnicians;
    }

    if (techIds.length === 0) return res.status(400).json({ message: "Nenhum técnico selecionado." });

    let whereClause = { isActive: true };
    if (!allDevices) {
        whereClause.AND = [];
        if (selectedSectors?.length > 0) whereClause.AND.push({ OR: [{ sectorId: { in: selectedSectors } }, { setorName: { in: selectedSectors } }] });
        if (selectedTypes?.length > 0) whereClause.AND.push({ deviceType: { in: selectedTypes } });
    }

    const devices = await prisma.device.findMany({ where: whereClause });
    if (devices.length === 0) return res.status(400).json({ message: "Nenhum dispositivo encontrado." });

    const busyAssignments = await prisma.actionPlanAssignment.findMany({
        where: { status: 'PENDING', plan: { status: { not: 'COMPLETED' } } }, select: { deviceId: true }
    });
    
    const busyDeviceIds = new Set(busyAssignments.map(a => a.deviceId));
    const availableDevices = devices.filter(d => !busyDeviceIds.has(d.id));

    if (availableDevices.length === 0) return res.status(400).json({ message: "Dispositivos já estão em uso em outro plano." });

    // 🟢 CÁLCULO DO PRAZO BASEADO NA PRODUTIVIDADE
    const totalDevices = availableDevices.length;
    const totalTechs = techIds.length;
    
    // 1️⃣ Média de dispositivos por técnico (Arredondado para cima)
    const cargaMaxima = Math.ceil(totalDevices / totalTechs); 
    
    // Capacidade diária informada no form (fallback 1 para não dividir por 0)
    const metaDiaria = parseInt(dailyCapacity) || 1; 
    
    // 3️⃣ Prazo estimado de conclusão (Dias úteis necessários para o técnico mais lotado terminar)
    const businessDaysRequired = Math.ceil(cargaMaxima / metaDiaria);
    
    // Adiciona os dias no calendário
    const finalDeadline = addBusinessDays(new Date(startDate), businessDaysRequired);

    const newPlan = await prisma.actionPlan.create({
        data: { name, startDate: new Date(startDate), deadline: finalDeadline, status: 'PENDING' }
    });

    const assignmentsData = availableDevices.map((device, index) => {
        const techIndex = index % techIds.length; 
        return { planId: newPlan.id, deviceId: device.id, technicianId: techIds[techIndex], status: 'PENDING' };
    });

    await prisma.actionPlanAssignment.createMany({ data: assignmentsData });

    res.json({ success: true, planId: newPlan.id, skipped: devices.length - availableDevices.length });
  } catch (error) { res.status(500).json({ message: "Erro interno ao criar." }); }
};

const deletePlan = async (req, res) => {
    try {
        await prisma.actionPlan.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================================================================================
// 4. WIDGET DA HOME (META DINÂMICA DO TÉCNICO)
// ==================================================================================
const getUserActionPlan = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        if (!userId) return res.status(401).json({ error: "Não identificado" });

        const assignments = await prisma.actionPlanAssignment.findMany({
            where: { technicianId: userId, status: 'PENDING', plan: { status: { not: 'COMPLETED' } } },
            include: { device: { include: { sector: true } }, plan: true },
            orderBy: [{ plan: { startDate: 'asc' } }, { plan: { deadline: 'asc' } }]
        });

        if (assignments.length === 0) return res.json(null);

        const activePlan = assignments[0].plan;
        const currentPlanAssignments = assignments.filter(a => a.planId === activePlan.id);

        const formattedDevices = currentPlanAssignments.map(a => {
            const isLate = a.plan.deadline && new Date(a.plan.deadline) < new Date();
            return {
                id: a.device.id, name: a.device.name,
                setor: a.device.sector ? a.device.sector.name : (a.device.setorName || 'S/ Setor'), 
                priority: isLate ? 'ALTA' : 'NORMAL',
                lastPreventive: a.device.lastPreventiveDate, assignmentId: a.id
            };
        });

        const totalPending = formattedDevices.length;
        let remainingDays = countBusinessDays(new Date(), activePlan.deadline);
        
        let dailyGoal = Math.ceil(totalPending / remainingDays);
        if (dailyGoal < 1) dailyGoal = 1;

        res.json({
            planId: activePlan.id, name: activePlan.name,
            stats: { 
                totalPending: totalPending,
                dailyGoal: dailyGoal,
                weeklyGoal: dailyGoal * 5,
                estimatedEndDate: activePlan.deadline 
            },
            assignments: formattedDevices
        });

    } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { listPlans, createPlan, deletePlan, getUserActionPlan };