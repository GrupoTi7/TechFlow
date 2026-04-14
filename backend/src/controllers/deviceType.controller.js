const deviceTypeService = require('../services/deviceType.service');

exports.listDeviceTypes = async (req, res) => {
  try {
    const types = await deviceTypeService.getAllDeviceTypes();
    res.json(types);
  } catch (error) {
    console.error("Erro listDeviceTypes:", error);
    res.status(500).json({ error: 'Erro ao buscar tipos.' });
  }
};

exports.createDeviceType = async (req, res) => {
  try {
    // 🟢 FORÇANDO A SEPARAÇÃO AQUI
    // Se o req.body vier bagunçado, nós extraímos na marra:
    console.log("📥 DADOS RECEBIDOS DO FRONTEND:", req.body);
    
    // Se o req.body.name for um objeto (que era o problema), nós extraímos dele. Se não, pegamos normal.
    const actualData = typeof req.body.name === 'object' ? req.body.name : req.body;

    const name = actualData.name;
    const key = actualData.key;
    const icon = actualData.icon;

    console.log("🛠️ DADOS DESEMPACOTADOS:", { name, key, icon });

    // Mandamos os dados isolados pro service
    const newType = await deviceTypeService.createDeviceType({ name: name, key: key, icon: icon });
    res.json(newType);

  } catch (error) {
    console.error("❌ Erro fatal no createDeviceType:", error);
    res.status(500).json({ error: 'Erro ao criar tipo.', details: error.message });
  }
};

exports.updateDeviceType = async (req, res) => {
  try {
    const { id } = req.params;
    
    const actualData = typeof req.body.name === 'object' ? req.body.name : req.body;
    const name = actualData.name;
    const key = actualData.key;
    const icon = actualData.icon;

    const updated = await deviceTypeService.updateDeviceType(id, { name: name, key: key, icon: icon });
    res.json(updated);
  } catch (error) {
    console.error("❌ Erro fatal no updateDeviceType:", error);
    res.status(500).json({ error: 'Erro ao atualizar tipo.', details: error.message });
  }
};

exports.deleteDeviceType = async (req, res) => {
  try {
    const { id } = req.params;
    await deviceTypeService.deleteDeviceType(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro deleteDeviceType:", error);
    res.status(500).json({ error: 'Erro ao excluir tipo.' });
  }
};