// src/services/auth.service.js
const { prisma } = require('../config/prismaClient'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function registerUser(userData) {
  const { name, email, username, password } = userData;
  const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existingUser) { throw new Error('Nome de usuário ou email já registado.'); }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({ 
    data: { 
      name, 
      email, 
      username, 
      password: hashedPassword,
      role: 'TECNICO' // Define o padrão, pode ser ajustado
    } 
  });
  
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async function loginUser(username, password) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) { 
    throw new Error('Credenciais inválidas.'); 
  }
  
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) { throw new Error('Chave secreta JWT não configurada.'); }
  
  // 🟢 A CORREÇÃO: Injetando o 'role' no payload do token
  const payload = { 
    id: user.id, 
    username: user.username,
    role: user.role // Agora o crachá VIP vai junto!
  };
  
  const token = jwt.sign(payload, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  
  // Retornando o token e os dados do usuário, alinhado com o controller
  return { 
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email
    }
  };
}

module.exports = { registerUser, loginUser };