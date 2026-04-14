const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); 

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Cria a senha "123456" criptografada
    const novaSenhaCriptografada = await bcrypt.hash('AWff*853', 10);

    // 2. O Comando Mágico: Cria o seu usuário se ele não existir, ou arruma a senha se existir
    const meuUsuario = await prisma.user.upsert({
      where: { username: 'vinicius.izidoro' },
      update: { 
          password: novaSenhaCriptografada,
          role: 'ADMIN' // Garante que você é o chefe
      },
      create: {
          name: 'Vinicius Izidoro',
          username: 'vinicius.izidoro',
          password: novaSenhaCriptografada,
          role: 'ADMIN' // Garante que você é o chefe
      }
    });

    console.log(`✅ SUCESSO ABSOLUTO!`);
    console.log(`O usuário '${meuUsuario.username}' está garantido no banco de dados.`);
    console.log(`Nível de acesso: ${meuUsuario.role}`);
    console.log(`Senha: AWff*853`);
    
  } catch (error) {
    console.error('❌ Erro fatal no banco de dados:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();