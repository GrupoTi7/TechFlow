const { generateActionPlan } = require('../services/actionPlan.service.js');

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

module.exports = { getActionPlan };