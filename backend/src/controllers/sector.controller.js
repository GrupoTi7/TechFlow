const sectorService = require('../services/sector.service');

exports.listSectors = async (req, res) => {
  // 🟢 LOG 1: Confirma que o Frontend bateu no Backend
  console.log("--> API: Recebi pedido de listagem de setores.");

  try {
    const sectors = await sectorService.getAllSectors();
    
    // 🟢 LOG 2: Confirma que o Banco devolveu dados
    console.log(`--> API: Sucesso! Encontrei ${sectors.length} setores.`);
    
    res.json(sectors);
  } catch (error) {
    // 🔴 LOG DE ERRO: Mostra no terminal o motivo real da falha
    console.error("--> ❌ API: Erro FATAL ao buscar setores:", error);
    
    // Retorna o erro detalhado para o navegador (ajuda a ver no Network tab)
    res.status(500).json({ error: 'Erro ao buscar setores.', details: error.message });
  }
};

exports.createSector = async (req, res) => {
  try {
    console.log("--> API: Criando novo setor...");
    const { name, interval } = req.body;
    
    // Regra de Negócio: Intervalo curto = Produção
    const type = parseInt(interval) <= 30 ? 'PRODUCAO' : 'ADMINISTRATIVO';
    
    const newSector = await sectorService.createSector({
      name,
      maintenanceInterval: parseInt(interval),
      type
    });
    
    res.json(newSector);
  } catch (error) {
    console.error("Erro ao criar setor:", error);
    res.status(500).json({ error: 'Erro ao criar setor.', details: error.message });
  }
};

exports.updateSector = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, interval } = req.body;
    const type = parseInt(interval) <= 30 ? 'PRODUCAO' : 'ADMINISTRATIVO';

    const updated = await sectorService.updateSector(id, {
      name,
      maintenanceInterval: parseInt(interval),
      type
    });
    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar setor:", error);
    res.status(500).json({ error: 'Erro ao atualizar setor.' });
  }
};

exports.deleteSector = async (req, res) => {
  try {
    await sectorService.deleteSector(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar setor:", error);
    res.status(500).json({ error: 'Erro ao excluir setor.' });
  }
};