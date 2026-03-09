const { prisma } = require('../config/prismaClient');

exports.getAllSectors = async () => {
  return await prisma.sector.findMany({
    orderBy: { name: 'asc' }
  });
};

exports.createSector = async (data) => {
  return await prisma.sector.create({ data });
};

exports.updateSector = async (id, data) => {
  return await prisma.sector.update({
    where: { id: id }, // ⚠️ ID é String, não use Number() ou parseInt()
    data,
  });
};

exports.deleteSector = async (id) => {
  return await prisma.sector.delete({
    where: { id: id }, // ⚠️ ID é String
  });
};