// src/services/preventive.service.js
const { prisma } = require('../config/prismaClient');
const { addDays } = require('date-fns');

// --- SUA LISTA DE SETORES DE PRODUÇÃO (30 DIAS) ---
const SETORES_PRODUCAO = [
  'Solda', 'Usinagem', 'Dobra', 'Estoque de Componentes', 'Calandra',
  'Serra', 'Prensa', 'Solda Robo', 'Ecoat', 'Qualidade', 'Seis Sigma',
  'Manutenção', 'Expedição (Deni)', 'Laser', 'Puncionadeira', 'Recebimento',
  'Pintura', 'Logística', 'Portaria Catraca', 'Laboratório Químico',
  'Almoxarifado', 'Balança', 'Expedição', 'Processos', 'Sala Limpa',
  'Ferramentaria', 'Braço Tridimencional', 'Casa de Tintas',
  'Depart. Técnico de Solda', 'Logística Empilhadeiras', 'Almoxarifado Transferíveis'
];
// --------------------------------------------------

/**
 * Busca o histórico de preventivas de um dispositivo
 */
async function findPreventivesByDevice(deviceId) {
  return prisma.preventive.findMany({
    where: { deviceId: deviceId },
    orderBy: { date: 'desc' },
  });
}

/**
 * Adiciona uma preventiva e recalcula a próxima data
 */
async function addPreventive(deviceId, preventiveData) {
  const { date, technician, notes } = preventiveData;
  
  return prisma.$transaction(async (tx) => {
    // 1. Busca o dispositivo "pai"
    const device = await tx.device.findUnique({ where: { id: deviceId } });
    if (!device) { throw new Error('Dispositivo não encontrado.'); }

    // ==========================================================
    // --- TRAVA DE SEGURANÇA DESATIVADA PARA TESTES ---
    // ==========================================================
    /*
    if (!device.maintenanceIntervalDays || !device.setor) {
      throw new Error(
        'AÇÃO BLOQUEADA: Este dispositivo ainda não foi categorizado.\n\n' +
        'Por favor, contacte um administrador para definir o Setor e o Intervalo deste dispositivo antes de registar uma preventiva.'
      );
    }
    */
    // ==========================================================

    // 3. Se passou, usa o intervalo definido pelo admin (ou 120 por padrão)
    const interval = device.maintenanceIntervalDays || 120;

    // 4. Crie a nova preventiva (para o histórico)
    const newPreventive = await tx.preventive.create({
      data: { date: new Date(date), technician, notes, deviceId },
    });

    // 5. Calcula a próxima data
    const nextPreventiveDate = addDays(newPreventive.date, interval);

    // 6. Atualiza o dispositivo "pai"
    await tx.device.update({
      where: { id: deviceId },
      data: { 
        lastPreventiveDate: newPreventive.date,
        nextPreventiveDate: nextPreventiveDate,
      },
    });

    return newPreventive;
  });
}

/**
 * Apaga uma preventiva e recalcula as datas do dispositivo "pai".
 */
async function deletePreventive(preventiveId) {
  return prisma.$transaction(async (tx) => {
    
    const preventiveToDelete = await tx.preventive.findUnique({
      where: { id: preventiveId },
    });
    
    if (!preventiveToDelete) {
      throw new Error('Preventiva não encontrada.');
    }
    const deviceId = preventiveToDelete.deviceId;

    await tx.preventive.delete({
      where: { id: preventiveId },
    });

    const latestPreventive = await tx.preventive.findFirst({
      where: { deviceId: deviceId },
      orderBy: { date: 'desc' },
    });

    const device = await tx.device.findUnique({ where: { id: deviceId } });
    if (!device) { throw new Error('Dispositivo pai não encontrado durante o recálculo.'); }
    
    let newLastPreventiveDate = null;
    let newNextPreventiveDate = null;

    if (latestPreventive) {
      newLastPreventiveDate = latestPreventive.date;
      const interval = device.maintenanceIntervalDays || 120; // Padrão 120 caso esteja vazio
      newNextPreventiveDate = addDays(latestPreventive.date, interval);
    } 

    await tx.device.update({
      where: { id: deviceId },
      data: {
        lastPreventiveDate: newLastPreventiveDate,
        nextPreventiveDate: newNextPreventiveDate,
      },
    });

    return { success: true };
  });
}

module.exports = { 
  findPreventivesByDevice, 
  addPreventive,
  deletePreventive 
};