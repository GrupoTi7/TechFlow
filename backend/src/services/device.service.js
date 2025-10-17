// src/services/device.service.js
const { prisma } = require('../config/prismaClient');

async function findAllDevices() {
  // Esta é a função que já tínhamos
  return prisma.device.findMany({
    orderBy: {
      name: 'asc',
    },
  });
}

// --- NOVA FUNÇÃO ---
// Busca um único dispositivo pelo seu ID
async function findDeviceById(id) {
  const device = await prisma.device.findUnique({
    where: { id: id },
  });

  if (!device) {
    throw new Error('Dispositivo não encontrado.');
  }
  return device;
}
// ---------------------

module.exports = { 
  findAllDevices,
  findDeviceById 
};