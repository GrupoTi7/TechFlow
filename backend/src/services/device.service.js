// src/services/device.service.js
const { prisma } = require('../config/prismaClient');
const { addDays } = require('date-fns'); // Já deve estar importado

// Esta função agora aceita um objeto de query com todos os nossos filtros
async function findAllDevices(query) {
  const { deviceType, status, searchQuery, nomenclature } = query;
  
  let where = {};
  const now = new Date();

  // Filtro de TIPO (Computador/Impressora)
  if (deviceType && deviceType !== 'all') {
    where.deviceType = deviceType;
  }

  // Filtro de STATUS (Atrasado/Próximo)
  if (status === 'overdue') {
    where.nextPreventiveDate = { lte: now };
  } else if (status === 'upcoming') {
    const thirtyDaysFromNow = addDays(now, 30);
    where.nextPreventiveDate = { gte: now, lte: thirtyDaysFromNow };
  }

  // --- 1. NOVA LÓGICA DE FILTRO DE NOMENCLATURA ---
  if (nomenclature === 'owned') {
    // Se o filtro for "Comprados"
    where.OR = [ 
      { name: { startsWith: 'PTR' } }, 
      { name: { startsWith: 'TRC' } } 
    ];
  } else if (nomenclature === 'rented') {
    // Se o filtro for "Alugados"
    where.OR = [ 
      { name: { startsWith: 'NETSITE' } }, 
      { name: { startsWith: 'VIVO' } } 
    ];
  }

  // Filtro de PESQUISA (Nome)
  if (searchQuery && searchQuery.trim() !== '') {
    where.name = { contains: searchQuery };
  }

  // 2. Executa a consulta no Prisma com os filtros construídos
  return prisma.device.findMany({
    where: where,
    orderBy: {
      name: 'asc',
    },
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

module.exports = { 
  findAllDevices,
  findDeviceById 
};