const { prisma } = require('../config/prismaClient');

exports.getAllSectors = async () => {
  return await prisma.sector.findMany({
    orderBy: { name: 'asc' }
  });
};

exports.createSector = async (data) => {
  // 🛡️ BLINDAGEM: Se o Controller enviou o objeto inteiro dentro de "data.name",
  // nós extraímos a informação da forma correta.
  const payload = (data.name && typeof data.name === 'object') ? data.name : data;

  return await prisma.sector.create({
    data: {
      name: payload.name,
      type: payload.type,
      maintenanceInterval: Number(payload.maintenanceInterval) || 30 // Garante número válido
    }
  });
};

exports.updateSector = async (id, data) => {
  // 🛡️ BLINDAGEM para a atualização também
  const payload = (data.name && typeof data.name === 'object') ? data.name : data;

  return await prisma.sector.update({
    where: { id: id }, // ID é String
    data: {
      name: payload.name,
      type: payload.type,
      maintenanceInterval: Number(payload.maintenanceInterval) || 30
    }
  });
};

exports.deleteSector = async (id) => {
  return await prisma.sector.delete({
    where: { id: id }, // ID é String
  });
};