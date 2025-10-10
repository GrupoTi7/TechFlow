// src/services/auth.service.js
const { prisma } = require('../config/prismaClient'); // Importação correta
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ... (cole aqui o resto do código da função registerUser e loginUser que já lhe enviei)
// Garanta que todo o conteúdo deste ficheiro está igual ao que já validámos.
async function registerUser(userData) {
  const { name, email, username, password } = userData;
  const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existingUser) { throw new Error('Nome de usuário ou email já registado.'); }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, username, password: hashedPassword } });
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
async function loginUser(username, password) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) { throw new Error('Credenciais inválidas.'); }
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) { throw new Error('Chave secreta JWT não configurada.'); }
  const payload = { id: user.id, username: user.username };
  const token = jwt.sign(payload, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  return { token };
}
module.exports = { registerUser, loginUser };