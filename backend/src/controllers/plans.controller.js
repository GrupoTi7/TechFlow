const { prisma } = require('../config/prismaClient');
const notificationService = require('../services/notification.service');

const fixedHolidays = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'];

function addBusinessDays(startDate, daysToAdd) {
    if (daysToAdd <= 0) return new Date(startDate);
    let currentDate = new Date(startDate);
    let addedDays = 0;
    while (addedDays < daysToAdd) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay(); 
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

const listPlans = async (req, res) => {
  try {
    const plans = await prisma.actionPlan.findMany({
      where: { status: { not: 'COMPLETED' } }, 
      orderBy: { createdAt: 'desc' },
      include: { 
        _count: { select: { assignments: { where: { status: 'PENDING' } } } }, 
        assignments: {
          where: { status: 'PENDING' }, 
          include: {
            device: true 
          }
        }
      }
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
  } catch (error) { 
    console.error("Erro no listPlans:", error);
    res.status(500).json({ error: error.message }); 
  }
};

const createPlan = async (req, res) => {
  const { 
      name, startDate, deadline, 
      targetSectors = [], 
      targetTypes = [], 
      distributeToAllTechs = true, 
      selectedTechs = [] 
  } = req.body;

  try {
    if (!name || !startDate) return res.status(400).json({ message: "Nome e data de início são obrigatórios." });

    let techIds = [];
    if (distributeToAllTechs) {
        const users = await prisma.user.findMany({ where: { role: { not: 'ADMIN' } }, select: { id: true } });
        techIds = users.map(u => u.id);
    } else {
        techIds = selectedTechs; 
    }

    if (techIds.length === 0) return res.status(400).json({ message: "Nenhum técnico selecionado para o plano." });

    let whereClause = { isActive: { not: false } }; 
    whereClause.AND = [];
    
    if (targetTypes && targetTypes.length > 0) {
        whereClause.AND.push({ deviceType: { in: targetTypes } });
    }

    // 🟢 A SOLUÇÃO: Busca tanto no relacionamento (caso exista no futuro) quanto na coluna de texto real (setorName)
    if (targetSectors && targetSectors.length > 0) {
        whereClause.AND.push({
            OR: [
                { sector: { name: { in: targetSectors } } },
                { setorName: { in: targetSectors } }
            ]
        });
    }

    if (whereClause.AND.length === 0) delete whereClause.AND;

    const devices = await prisma.device.findMany({ 
        where: whereClause,
        include: { sector: true } 
    });

    if (devices.length === 0) {
        const nomeTipo = targetTypes.length > 0 ? targetTypes.join(' ou ') : 'dispositivo';
        return res.status(400).json({ message: `Oba! Nenhum ${nomeTipo} encontrado para esses filtros.` });
    }

    const busyAssignments = await prisma.actionPlanAssignment.findMany({
        where: { status: 'PENDING', plan: { status: { not: 'COMPLETED' } } }, select: { deviceId: true }
    });
    
    const busyDeviceIds = new Set(busyAssignments.map(a => a.deviceId));
    const availableDevices = devices.filter(d => !busyDeviceIds.has(d.id));

    if (availableDevices.length === 0) return res.status(400).json({ message: "Todos os dispositivos encontrados já estão em uso em outro plano ativo." });

    let finalDeadline = deadline ? new Date(deadline) : null;
    if (!finalDeadline) {
        finalDeadline = addBusinessDays(new Date(startDate), 22);
    }

    const newPlan = await prisma.actionPlan.create({
        data: { name, startDate: new Date(startDate), deadline: finalDeadline, status: 'PENDING' }
    });

    const assignmentsData = availableDevices.map((device, index) => {
        const techIndex = index % techIds.length; 
        return { planId: newPlan.id, deviceId: device.id, technicianId: techIds[techIndex], status: 'PENDING' };
    });

    await prisma.actionPlanAssignment.createMany({ data: assignmentsData });

    res.json({ success: true, planId: newPlan.id, added: availableDevices.length, skipped: devices.length - availableDevices.length });
  } catch (error) { 
      console.error("Erro no createPlan:", error);
      res.status(500).json({ message: "Erro interno ao criar o plano.", details: error.message }); 
  }
};

const deletePlan = async (req, res) => {
    try {
        await prisma.actionPlan.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const getUserActionPlan = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        if (!userId) return res.status(401).json({ error: "Não identificado" });

        const assignments = await prisma.actionPlanAssignment.findMany({
            where: { technicianId: userId, status: 'PENDING', plan: { status: { not: 'COMPLETED' } } },
            include: { device: { include: { sector: true } }, plan: true },
            orderBy: [{ plan: { startDate: 'asc' } }, { plan: { deadline: 'asc' } }]
        });

        if (assignments.length === 0) return res.json([]);

        const plansMap = {};
        assignments.forEach(a => {
            if (!plansMap[a.planId]) {
                plansMap[a.planId] = { id: a.plan.id, name: a.plan.name, deadline: a.plan.deadline, assignments: [] };
            }
            const isLate = a.plan.deadline && new Date(a.plan.deadline) < new Date();
            // 🟢 A CORREÇÃO DE EXIBIÇÃO: Lendo de setorName em vez de setor
            const setorName = a.device.sector?.name || a.device.setorName || 'S/ Setor';
            
            plansMap[a.planId].assignments.push({
                id: a.device.id, name: a.device.name, type: a.device.deviceType,
                setor: setorName, priority: isLate ? 'ALTA' : 'NORMAL',
                lastPreventive: a.device.lastPreventiveDate, assignmentId: a.id
            });
        });

        const result = Object.values(plansMap).map(plan => {
            const totalPending = plan.assignments.length;
            let remainingDays = countBusinessDays(new Date(), plan.deadline);
            let dailyGoal = Math.max(Math.ceil(totalPending / remainingDays), 1);
            return {
                id: plan.id, name: plan.name,
                stats: { totalPending, dailyGoal, weeklyGoal: dailyGoal * 5, estimatedEndDate: plan.deadline },
                assignments: plan.assignments
            };
        });

        res.json(result); 

    } catch (error) { res.status(500).json({ error: error.message }); }
};

const sendReminder = async (req, res) => {
    try {
        const { planId, planName, totalPending, daysLeft } = req.body;
        
        const teamEmails = [
            'marcus.cortez@ptractor.com.br',
            'alex.maciel@ptractor.com.br',
            'carlos.oliveira@ptractor.com.br',
            'vinicius.izidoro@ptractor.com.br'
        ];

        await notificationService.sendActionPlanReminder(planName, totalPending, daysLeft, teamEmails);
        
        res.status(200).json({ success: true, message: 'Cobrança enviada com sucesso!' });
    } catch (error) {
        console.error('Erro ao disparar cobrança:', error);
        res.status(500).json({ success: false, message: 'Erro ao enviar notificação.', error: error.message });
    }
};

module.exports = { listPlans, createPlan, deletePlan, getUserActionPlan, sendReminder };