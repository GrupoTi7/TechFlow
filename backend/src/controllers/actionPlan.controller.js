const { generateActionPlan } = require('../services/actionPlan.service.js');
const notificationService = require('../services/notification.service');

const getActionPlan = async (req, res) => {
  try {
    // 🟢 Agora ele pega os filtros que vieram do Frontend (botões da tela)
    const filters = req.body || {}; 
    
    // Passa os filtros para a inteligência do plano
    const plan = await generateActionPlan(filters);
    
    return res.json(plan);
  } catch (error) {
    console.error("Erro ao gerar Plano de Ação:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

async function sendReminder(req, res) {
    try {
        const { planName, totalPending, daysLeft } = req.body;
        
        // Chama a função de e-mail que acabamos de criar
        await notificationService.sendActionPlanReminder(planName, totalPending, daysLeft);
        
        res.status(200).json({ success: true, message: 'Cobrança enviada com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao enviar notificação.', error: error.message });
    }
}

module.exports = { getActionPlan,sendReminder };