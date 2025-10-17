// src/services/preventive.service.js
const { prisma } = require('../config/prismaClient');
const { addDays } = require('date-fns');

async function findPreventivesByDevice(deviceId) {
  return prisma.preventive.findMany({
    where: { deviceId: deviceId },
    orderBy: { date: 'desc' },
  });
}

async function addPreventive(deviceId, preventiveData) {
  const { date, technician, notes } = preventiveData;
  return prisma.$transaction(async (tx) => {
    const device = await tx.device.findUnique({ where: { id: deviceId } });
    if (!device) { throw new Error('Dispositivo não encontrado.'); }

    const newPreventive = await tx.preventive.create({
      data: { date: new Date(date), technician, notes, deviceId },
    });

    const interval = device.maintenanceIntervalDays;
    const nextPreventiveDate = addDays(newPreventive.date, interval);

    await tx.device.update({
      where: { id: deviceId },
      data: { nextPreventiveDate: nextPreventiveDate },
    });

    return newPreventive;
  });
}

module.exports = { findPreventivesByDevice, addPreventive };