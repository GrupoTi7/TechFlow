const { prisma } = require('../config/prismaClient');

exports.getAllDeviceTypes = async () => {
  return await prisma.deviceType.findMany({
    orderBy: { name: 'asc' }
  });
};

exports.createDeviceType = async (data) => {
  return await prisma.deviceType.create({ data });
};

exports.updateDeviceType = async (id, data) => {
  return await prisma.deviceType.update({
    where: { id: id }, // ID é String (CUID)
    data
  });
};

exports.deleteDeviceType = async (id) => {
  return await prisma.deviceType.delete({
    where: { id: id } // ID é String (CUID)
  });
};