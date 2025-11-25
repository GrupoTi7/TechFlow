// backend/src/controllers/auth.controller.js
const { prisma } = require('../config/prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Nativo do Node.js
const nodemailer = require('nodemailer'); // Vamos configurar o envio aqui para ser direto

// Configuração rápida de e-mail (Reusando suas variáveis)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  tls: { rejectUnauthorized: false }
});

const register = async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
  }

  try {
    // 1. Verifica se já existe
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Nome de usuário já existe.' });
    }

    // 2. Criptografa a senha (MUITO IMPORTANTE)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Cria no banco
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: email || null // Opcional, mas bom para recuperar senha depois
      }
    });

    res.status(201).json({ success: true, message: 'Usuário criado com sucesso!', userId: newUser.id });

  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- LOGIN (MANTIDO) ---
const login = async (req, res) => {
  // ... (mantenha a sua função de login atual aqui) ...
  // Se não tiver o código fácil, avise que eu mando completo. 
  // Mas basicamente é a mesma lógica que você já tem.
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Senha incorreta' });
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 1. SOLICITAR RECUPERAÇÃO ---
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      // Por segurança, não dizemos se o email existe ou não, apenas dizemos "Se existir, enviamos".
      return res.json({ success: true, message: "Se o e-mail estiver cadastrado, você receberá um link." });
    }

    // Gera um token aleatório
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hora de validade

    // Salva no banco
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry }
    });

    // Link para o Frontend (Ajuste o IP se mudar)
    const resetLink = `http://10.20.2.75:8080/reset-password/${token}`;

    // Envia E-mail
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Recuperação de Senha - TechFlow',
      html: `
        <div style="font-family: Arial; color: #333;">
          <h2>Recuperação de Senha</h2>
          <p>Você solicitou a troca de senha. Clique no botão abaixo para criar uma nova:</p>
          <a href="${resetLink}" style="background-color: #0041C2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Redefinir Senha</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">Este link expira em 1 hora.</p>
        </div>
      `
    });

    res.json({ success: true, message: "E-mail enviado com sucesso." });

  } catch (error) {
    console.error("Erro reset:", error);
    res.status(500).json({ success: false, message: "Erro ao processar solicitação." });
  }
};

// --- 2. REDEFINIR SENHA ---
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Busca usuário com token válido e não expirado
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() } // Expiry > Agora
      }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Token inválido ou expirado." });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza e limpa o token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ success: true, message: "Senha alterada com sucesso!" });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao redefinir senha." });
  }
};

module.exports = { login, requestPasswordReset, resetPassword };