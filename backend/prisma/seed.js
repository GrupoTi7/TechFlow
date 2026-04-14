const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed do Banco de Dados...');

  // 1. Criar Usuário Admin Padrão
  const hashedPassword = await bcrypt.hash('admin123', 10); // Senha: admin123
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Administrador',
      username: 'admin',
      email: 'admin@techflow.com',
      password: hashedPassword,
      role: 'ADMIN', 
    },
  });
  console.log(`👤 Usuário Admin criado: ${admin.username}`);

  // 2. Criar Setores Padrão
  const setores = [
    { name: 'Administrativo', type: 'ADMINISTRATIVO', maintenanceInterval: 120 },
    { name: 'Produção', type: 'PRODUCAO', maintenanceInterval: 30 },
    { name: 'TI', type: 'PRODUCAO', maintenanceInterval: 30 },
  ];

  for (const s of setores) {
    await prisma.sector.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }
  console.log('🏭 Setores padrão criados.');

  // 3. Criar Tipos de Dispositivos Padrão
  const tipos = [
    { name: 'Computador/Desktop', key: 'desktop', icon: 'desktop' },
    { name: 'Notebook/Laptop', key: 'notebook', icon: 'laptop' },
    { name: 'Impressora', key: 'printer', icon: 'printer' },
    { name: 'Servidor', key: 'server', icon: 'server' },
    { name: 'Switch', key: 'switch', icon: 'switch' },
  ];

  for (const t of tipos) {
    await prisma.deviceType.upsert({
      where: { key: t.key },
      update: {},
      create: t,
    });
  }
  console.log('💻 Tipos de dispositivo criados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });