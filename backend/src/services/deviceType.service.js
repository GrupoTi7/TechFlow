const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllDeviceTypes = async () => {
  return await prisma.deviceType.findMany();
};

exports.createDeviceType = async (data) => {
  // Recebe a caixa de dados e distribui perfeitamente
  return await prisma.deviceType.create({
    data: {
      name: data.name,
      key: data.key,
      icon: data.icon
    }
  });
};

exports.updateDeviceType = async (id, data) => {
  return await prisma.deviceType.update({
    where: { id },
    data: {
      name: data.name,
      key: data.key,
      icon: data.icon
    }
  });
};

exports.deleteDeviceType = async (id) => {
  return await prisma.deviceType.delete({
    where: { id }
  });
};