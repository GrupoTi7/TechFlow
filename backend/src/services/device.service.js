const { prisma } = require('../config/prismaClient');

async function findAllDevices() {
  return prisma.device.findMany({
    orderBy: { name: 'asc' },
  });
}

module.exports = { findAllDevices };