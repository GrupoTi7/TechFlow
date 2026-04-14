// backend/reset-password.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // Ou 'bcrypt', dependendo do que você instalou

const prisma = new PrismaClient();

async function reset() {
  console.log('🔄 Gerando hash para a senha "123"...');
  
  // 1. Gera o hash seguro
  const passwordHash = await bcrypt.hash('123', 10);
  
  console.log('🔑 Hash gerado:', passwordHash);

  // 2. Atualiza o usuário existente
  // Certifique-se que o username abaixo é EXATAMENTE igual ao do banco
  const usernameAlvo = 'vinicius.izidoro'; 

  try {
    const user = await prisma.user.update({
      where: { username: usernameAlvo },
      data: { 
        password: passwordHash,
        role: 'TECNICO' // Garante que ele é técnico para o teste
      }
    });
    console.log(`✅ Sucesso! A senha do usuário "${user.username}" foi alterada para "123".`);
    console.log(`Função atual: ${user.role}`);
  } catch (error) {
    console.error('❌ Erro: Usuário não encontrado ou erro no banco.');
    console.error(error);
  }
}

reset()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());