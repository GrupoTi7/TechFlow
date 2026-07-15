const { prisma } = require('../config/prismaClient');
const notificationService = require('../services/notification.service');

const fixedHolidays = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'];

// 🟢 FUNÇÃO INTELIGENTE: Pula para o próximo dia útil disponível
const snapToBusinessDay = (date) => {
    let d = new Date(date);
    while (true) {
        const dayOfWeek = d.getDay();
        const monthDay = String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        if (dayOfWeek === 0 || dayOfWeek === 6 || fixedHolidays.includes(monthDay)) {
            d.setDate(d.getDate() + 1);
        } else {
            break;
        }
    }
    return d;
};

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
        _count: { select: { assignments: true } }, 
        assignments: {
          include: { device: true }
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
      name, startDate, 
      targetSectors = [], 
      targetTypes = [], 
      distributeToAllTechs = true, 
      selectedTechs = [],
      dailyCapacity = 1, // 🟢 Alterei o padrão para 1
      deadline           // 🟢 AGORA ELE RECEBE E LÊ A DATA DA SUA TELA!
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

    // 🟢 MANTEMOS O LOOP APENAS PARA DISTRIBUIR O TRABALHO PARA OS TÉCNICOS
    const distribution = [];
    let currentDate = snapToBusinessDay(new Date(startDate));
    let currentTechIndex = 0;
    let currentTechAssignedToday = 0;

    for (const device of availableDevices) {
        distribution.push({
            deviceId: device.id,
            technicianId: techIds[currentTechIndex],
            status: 'PENDING',
            plannedDate: new Date(currentDate) // Agendamento de cada dia
        });

        currentTechAssignedToday++;

        if (currentTechAssignedToday >= Number(dailyCapacity)) {
            currentTechAssignedToday = 0;
            currentTechIndex++;

            if (currentTechIndex >= techIds.length) {
                currentTechIndex = 0;
                currentDate.setDate(currentDate.getDate() + 1);
                currentDate = snapToBusinessDay(currentDate);
            }
        }
    }

    // 🟢 A REGRA DE OURO DA DATA
    // O loop calculou uma data baseada nas máquinas que encontrou...
    const calculatedDeadline = new Date(currentDate);
    
    // MAS, se o Frontend nos enviou a sua Data Limite explícita, ELA TEM PRIORIDADE MÁXIMA!
    const dataLimiteDefinitiva = deadline ? new Date(deadline) : calculatedDeadline;

    const newPlan = await prisma.actionPlan.create({
        data: { 
            name, 
            startDate: new Date(startDate), 
            deadline: dataLimiteDefinitiva, // A DATA DA TELA ESTÁ AQUI, INTACTA!
            status: 'PENDING',
            dailyCapacity: Number(dailyCapacity) // A CAPACIDADE DA TELA TAMBÉM!
        }
    });

    const assignmentsData = distribution.map(d => ({ ...d, planId: newPlan.id }));
    await prisma.actionPlanAssignment.createMany({ data: assignmentsData });

    res.json({ success: true, planId: newPlan.id, added: availableDevices.length, skipped: devices.length - availableDevices.length, deadline: dataLimiteDefinitiva });
  } catch (error) { 
      console.error("Erro no createPlan:", error);
      res.status(500).json({ message: "Erro interno ao criar o plano.", details: error.message }); 
  }
};

const deletePlan = async (req, res) => {
    try {
        // 🟢 1º Passo: Limpa todas as máquinas/atribuições amarradas a este plano
        await prisma.actionPlanAssignment.deleteMany({ 
            where: { planId: req.params.id } 
        });
        
        // 🟢 2º Passo: Agora sim, deleta o plano vazio com segurança
        await prisma.actionPlan.delete({ 
            where: { id: req.params.id } 
        });
        
        res.json({ success: true });
    } catch (error) { 
        console.error("Erro ao deletar plano:", error);
        res.status(500).json({ error: error.message }); 
    }
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
                plansMap[a.planId] = { 
                    id: a.plan.id, 
                    name: a.plan.name, 
                    deadline: a.plan.deadline, 
                    dailyCapacity: a.plan.dailyCapacity || 4, // 🟢 Puxa a capacidade salva
                    assignments: [] 
                };
            }
            const isLate = a.plan.deadline && new Date(a.plan.deadline) < new Date();
            const setorName = a.device.sector?.name || a.device.setorName || 'S/ Setor';
            
            plansMap[a.planId].assignments.push({
                id: a.device.id, name: a.device.name, type: a.device.deviceType,
                setor: setorName, priority: isLate ? 'ALTA' : 'NORMAL',
                lastPreventive: a.device.lastPreventiveDate, assignmentId: a.id,
                plannedDate: a.plannedDate // 🟢 Envia a data exata para o frontend
            });
        });

        const result = Object.values(plansMap).map(plan => {
            const totalPending = plan.assignments.length;
            return {
                id: plan.id, name: plan.name,
                // 🟢 Agora os goals (metas) usam o valor real do plano!
                stats: { totalPending, dailyGoal: plan.dailyCapacity, weeklyGoal: plan.dailyCapacity * 5, estimatedEndDate: plan.deadline },
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