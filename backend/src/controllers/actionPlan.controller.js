const { generateActionPlan } = require('../services/actionPlan.service.js');
const notificationService = require('../services/notification.service');

// =======================================================================
// 🟢 1. CÉREBRO DA MATEMÁTICA E DIAS ÚTEIS (FONTE ÚNICA DA VERDADE)
// =======================================================================
function countBusinessDays(startDate, endDate) {
    let count = 0;
    let currentDate = new Date(startDate);
    let end = new Date(endDate);
    currentDate.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    const fixedHolidays = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'];
    
    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        const monthDay = String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !fixedHolidays.includes(monthDay)) count++;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
}

function addBusinessDays(startDate, daysToAdd) {
    let currentDate = new Date(startDate);
    currentDate.setHours(12,0,0,0); // Mantém a blindagem de fuso horário intacta
    if (daysToAdd <= 0) return currentDate;

    let addedDays = 0;
    const fixedHolidays = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'];
    
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

// =======================================================================
// 🟢 2. NOVA ROTA DE CRIAÇÃO (INTERCETA, CALCULA E SALVA)
// =======================================================================
const createActionPlan = async (req, res) => {
    try {
        const { dailyCapacity, deadline, targetCount, selectedTechs, startDate } = req.body;

        const safeStartDate = new Date(startDate);
        const techCount = selectedTechs ? selectedTechs.length : 1;

        let finalCapacity = dailyCapacity;
        let finalDeadline = deadline ? new Date(deadline) : null;

        // CENÁRIO A: O Frontend enviou a Data Limite. O Backend descobre a Capacidade.
        if (!dailyCapacity && deadline) {
            const businessDays = countBusinessDays(safeStartDate, finalDeadline);
            finalCapacity = businessDays > 0 ? Math.ceil(targetCount / (techCount * businessDays)) : 1;
        } 
        // CENÁRIO B: O Frontend enviou a Capacidade. O Backend descobre a Data Limite.
        else if (dailyCapacity && !deadline) {
            const capacityPerDay = techCount * dailyCapacity;
            const daysNeeded = Math.ceil(targetCount / capacityPerDay);
            finalDeadline = addBusinessDays(safeStartDate, Math.max(0, daysNeeded - 1));
        }

        // 🟢 Agora temos as métricas absolutamente corretas e perfeitamente calculadas!
        // Montamos o pacote final para a inteligência de serviço (Prisma) salvar.
        const perfectPayload = {
            ...req.body,
            startDate: safeStartDate,
            dailyCapacity: finalCapacity,
            deadline: finalDeadline
        };

        const plan = await generateActionPlan(perfectPayload);
        
        return res.status(201).json(plan);
    } catch (error) {
        console.error("Erro ao criar Plano de Ação:", error.message);
        return res.status(500).json({ error: error.message });
    }
};

// =======================================================================
// 🟢 3. ROTAS ANTIGAS MANTIDAS INTACTAS
// =======================================================================
const getActionPlan = async (req, res) => {
  try {
    const filters = req.body || {}; 
    const plan = await generateActionPlan(filters);
    return res.json(plan);
  } catch (error) {
    console.error("Erro ao gerar Plano de Ação:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

async function sendReminder(req, res) {
    try {
        const { planId, planName, totalPending, daysLeft } = req.body;
        
        const teamEmails = [
            'marcus.cortez@ptractor.com.br',
            'alex.maciel@ptractor.com.br',
            'carlos.oliveira@ptractor.com.br',
            'vinicius.izidoro@ptractor.com.br'
        ];

        await notificationService.sendActionPlanReminder(planName, totalPending, daysLeft, teamEmails);
        res.status(200).json({ success: true, message: 'Cobrança enviada com sucesso para a equipe técnica!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao enviar notificação.', error: error.message });
    }
}

// 🟢 Adicionamos o createActionPlan aos exports
module.exports = { getActionPlan, sendReminder, createActionPlan };