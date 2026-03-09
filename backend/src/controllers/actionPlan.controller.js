const { generateActionPlan } = require('../services/actionPlan.service.js');

const getActionPlan = async (req, res) => {
  try {
    const plan = await generateActionPlan();
    return res.json(plan);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { getActionPlan };