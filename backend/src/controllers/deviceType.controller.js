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
    const { name, key, icon } = req.body;
    const newType = await deviceTypeService.createDeviceType({ name, key, icon });
    res.json(newType);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar tipo.' });
  }
};

exports.updateDeviceType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, key, icon } = req.body;
    const updated = await deviceTypeService.updateDeviceType(id, { name, key, icon });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tipo.' });
  }
};

exports.deleteDeviceType = async (req, res) => {
  try {
    const { id } = req.params;
    await deviceTypeService.deleteDeviceType(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir tipo.' });
  }
};