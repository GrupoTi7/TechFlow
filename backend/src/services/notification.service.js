// src/services/notification.service.js
const { prisma } = require('../config/prismaClient');
const { addDays, format, startOfDay, isBefore, isAfter, isEqual } = require('date-fns');
const nodemailer = require('nodemailer');

// 1. Configuração do Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, 
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000, 
  greetingTimeout: 10000
});

// Teste de conexão SMTP
async function verifySmtpConnection() {
  console.log(`[SMTP Test] Tentando conectar a ${process.env.EMAIL_HOST}...`);
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('[SMTP Test] ❌ FALHA:', error.message);
    return false;
  }
}

/**
 * Função Principal
 */
async function checkAndSendNotifications() {
  console.log('--- [Email Job] Iniciando verificação ---');

  const isConnected = await verifySmtpConnection();
  if (!isConnected) throw new Error(`Falha conexão SMTP`);

  const now = startOfDay(new Date());
  const upcomingLimit = addDays(now, 30);

  // Busca dispositivos
  const allDevices = await prisma.device.findMany({
    where: { isActive: true, nextPreventiveDate: { not: null } }
  });

  const overdueDevices = [];
  const upcomingDevices = [];

  allDevices.forEach(device => {
    const nextDate = startOfDay(new Date(device.nextPreventiveDate));
    if (isBefore(nextDate, now)) {
      overdueDevices.push(device);
    } else if (isBefore(nextDate, upcomingLimit) || isEqual(nextDate, upcomingLimit)) {
      upcomingDevices.push(device);
    }
  });

  if (overdueDevices.length === 0 && upcomingDevices.length === 0) {
    return { success: true, message: "Nenhum alerta necessário." };
  }

  // --- CONSTRUÇÃO DO HTML ---
  const reportDate = format(new Date(), 'dd/MM/yyyy HH:mm');
  
  // Link de Acesso solicitado
  const systemLink = "https://10.20.2.75/login";

  // Estilos Inline
  const styleContainer = "font-family: Arial, sans-serif; color: #000; max-width: 800px;";
  const styleTitle = "font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #000;";
  const styleDate = "margin-top: 0; font-size: 14px; color: #333; margin-bottom: 20px;";
  const styleH2 = "font-size: 18px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;";
  const styleUl = "list-style-type: disc; margin-left: 20px; padding: 0;";
  const styleLi = "margin-bottom: 5px; font-size: 14px;";
  const styleLink = "color: #0056b3; text-decoration: none; font-weight: bold;";
  const styleFooter = "margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 12px; color: #888; text-align: center;";

  let emailBody = `
    <div style="${styleContainer}">
      
      <h1 style="${styleTitle}">Alerta de Manutenção Preventiva - TechFlow</h1>
      <p style="${styleDate}">Relatório gerado em: ${reportDate}</p>
  `;

  // Seção Atrasadas (Vermelho)
  if (overdueDevices.length > 0) {
    emailBody += `
      <h2 style="${styleH2} color: red;">🚨 Preventivas Atrasadas (${overdueDevices.length})</h2>
      <ul style="${styleUl}">
        ${overdueDevices.map(d => `
          <li style="${styleLi}">
            <strong>${d.name}</strong> (${d.setor || 'N/D'}) - Venceu em: ${format(new Date(d.nextPreventiveDate), 'dd/MM/yyyy')}
          </li>
        `).join('')}
      </ul>
    `;
  }

  // Seção Próximas (Laranja)
  if (upcomingDevices.length > 0) {
    emailBody += `
      <h2 style="${styleH2} color: #e67e22;">⚠️ Preventivas Próximas (${upcomingDevices.length})</h2>
      <ul style="${styleUl}">
        ${upcomingDevices.map(d => `
          <li style="${styleLi}">
            <strong>${d.name}</strong> (${d.setor || 'N/D'}) - Vence em: ${format(new Date(d.nextPreventiveDate), 'dd/MM/yyyy')}
          </li>
        `).join('')}
      </ul>
    `;
  }

  // Rodapé com o Link
  emailBody += `
      <div style="${styleFooter}">
        <p>Acesse o sistema para mais detalhes:</p>
        <p><a href="${systemLink}" style="${styleLink}">Acessar TechFlow</a></p>
        <p>Este é um e-mail automático.</p>
      </div>
    </div>
  `;

  // 4. Envia
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: `[TechFlow] Alerta: ${overdueDevices.length} Atrasadas | ${upcomingDevices.length} Próximas`,
      html: emailBody
    });
    console.log(`[Email Job] ✅ Enviado! ID: ${info.messageId}`);
    return { success: true, message: "E-mail enviado com sucesso." };
  } catch (error) {
    console.error('[Email Job] ❌ Erro:', error);
    throw error;
  }
}

module.exports = { checkAndSendNotifications };