// src/services/device.service.js
const { prisma } = require('../config/prismaClient');
const { addDays } = require('date-fns'); // Já deve estar importado

// Esta função agora aceita um objeto de query com todos os nossos filtros
async function findAllDevices(queryParams) {
  // Extrai os filtros que vêm da URL (ex: ?deviceType=PC)
  const { deviceType, department /* ...outros filtros... */ } = queryParams;

  // Começa com o filtro OBRIGATÓRIO
  const filters = {
    isActive: true // <-- A CORREÇÃO ESTÁ AQUI
  };

  // Adiciona os filtros opcionais se eles existirem
  if (deviceType) filters.deviceType = deviceType;
  if (department) filters.department = department;
  // ...

  // A consulta agora SEMPRE filtrará por 'isActive: true'
  // E também pelos filtros da query, se houver
  return prisma.device.findMany({
    where: filters, 
    orderBy: { name: 'asc' }
  });
}

// A função findDeviceById continua igual
async function findDeviceById(id) {
  const device = await prisma.device.findUnique({
    where: { id: id },
  });
  if (!device) {
    throw new Error('Dispositivo não encontrado.');
  }
  return device;
}

async function cleanupDefaultValues() {
  const result = await prisma.device.updateMany({
    where: {
      // Procura por qualquer dispositivo que ainda tenha os padrões errados
      OR: [
        { setor: "Escritório" },
        { maintenanceIntervalDays: 120 }
      ]
    },
    data: {
      setor: null, // Limpa o setor
      maintenanceIntervalDays: null // Limpa o intervalo
    }
  });
  return result.count;
}

async function bulkUpdateSetors(updates) {
  // 'updates' é um array, ex: [{ id: "123", setor: "Solda", interval: 30 }, ...]

  const transactions = updates.map(update => 
    prisma.device.update({
      where: { id: update.id },
      data: {
        setor: update.setor,
        maintenanceIntervalDays: update.interval
      }
    })
  );

  // Executa todas as atualizações dentro de uma única transação
  await prisma.$transaction(transactions);
  
  return updates.length; // Retorna quantos dispositivos foram atualizados
}

async function cleanupDefaultValues() {
  
  // Nós não podemos usar 'updateMany' com 'NOT: {setor: null}' 
  // porque o Prisma pode ter limitações.
  // Em vez disso, vamos forçar a limpeza em TODOS OS DISPOSITIVOS.
  
  const countResult = await prisma.device.count();
  
  await prisma.device.updateMany({
    where: {}, // ATENÇÃO: Isto vai atualizar TODOS os 405 dispositivos
    data: {
      setor: null, // Limpa o setor
      maintenanceIntervalDays: null // Limpa o intervalo
    }
  });

  return countResult; // Retorna o número total de dispositivos que foram limpos
}

module.exports = { 
  findAllDevices,
  findDeviceById, 
 cleanupDefaultValues,
 bulkUpdateSetors
};