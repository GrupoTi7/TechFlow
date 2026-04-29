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
        // Recebe os dados do plano que vieram do botão no Frontend
        const { planId, planName, totalPending, daysLeft } = req.body;
        
        // 🟢 A SUA LISTA OFICIAL DE E-MAILS DA EQUIPE DE MANUTENÇÃO
        const teamEmails = [
            'marcus.cortez@ptractor.com.br',
            'alex.maciel@ptractor.com.br',
            'carlos.oliveira@ptractor.com.br',
            'vinicius.izidoro@ptractor.com.br'
        ];

        // Chama o serviço de e-mail passando a lista exata
        await notificationService.sendActionPlanReminder(planName, totalPending, daysLeft, teamEmails);
        
        res.status(200).json({ success: true, message: 'Cobrança enviada com sucesso para a equipe técnica!' });
    } catch (error) {
        console.error('Erro ao disparar cobrança:', error);
        res.status(500).json({ success: false, message: 'Erro ao enviar notificação.', error: error.message });
    }
}

module.exports = { getActionPlan,sendReminder };