// src/services/preventive.service.js

const { prisma } = require('../config/prismaClient');
const { addDays } = require('date-fns'); // Biblioteca para manipular datas (precisaremos de a instalar)

/**
 * Busca todas as preventivas de um dispositivo específico.
 * @param {string} deviceId - O ID do dispositivo.
 */
async function findPreventivesByDevice(deviceId) {
  // Busca as preventivas associadas ao ID do dispositivo, ordenadas pela mais recente.
  return prisma.preventive.findMany({
    where: { deviceId: deviceId },
    orderBy: { date: 'desc' },
  });
}

/**
 * Cria uma nova preventiva para um dispositivo e calcula a data da próxima.
 * @param {string} deviceId - O ID do dispositivo.
 * @param {object} preventiveData - Dados da preventiva (date, technician, notes).
 */
async function addPreventive(deviceId, preventiveData) {
  const { date, technician, notes } = preventiveData;

  // Usamos uma transação para garantir que ambas as operações (criar a preventiva
  // e atualizar o dispositivo) aconteçam com sucesso, ou nenhuma delas acontece.
  // Isto mantém a consistência dos dados.
  return prisma.$transaction(async (tx) => {
    // 1. Encontrar o dispositivo para obter o seu intervalo de manutenção.
    const device = await tx.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new Error('Dispositivo não encontrado.');
    }

    // 2. Criar o novo registo de preventiva.
    const newPreventive = await tx.preventive.create({
      data: {
        date: new Date(date), // Garante que a data é um objeto Date
        technician,
        notes,
        deviceId, // Liga esta preventiva ao dispositivo
      },
    });

    // 3. Calcular a data da próxima preventiva.
    const interval = device.maintenanceIntervalDays;
    const nextPreventiveDate = addDays(newPreventive.date, interval);

    // 4. Atualizar o dispositivo com a nova data da próxima preventiva.
    await tx.device.update({
      where: { id: deviceId },
      data: { nextPreventiveDate: nextPreventiveDate },
    });

    console.log(`Preventiva registada para o dispositivo ${deviceId}. Próxima em: ${nextPreventiveDate.toISOString()}`);
    
    // 5. Retornar a preventiva que acabámos de criar.
    return newPreventive;
  });
}

module.exports = { findPreventivesByDevice, addPreventive };