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
    pass: process.env.EMAIL_PASSWORD, // (Confirme se no Portainer está EMAIL_PASSWORD)
  },
  tls: {
    rejectUnauthorized: false 
  },
  // Adiciona timeout para não ficar "pendurado"
  connectionTimeout: 10000, 
  greetingTimeout: 10000
});

/**
 * TESTE DE CONEXÃO (Novo)
 * Verifica se o servidor consegue falar com o SMTP
 */
async function verifySmtpConnection() {
  console.log(`[SMTP Test] Tentando conectar a ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}...`);
  try {
    await transporter.verify();
    console.log('[SMTP Test] ✅ Conexão SMTP BEM SUCEDIDA!');
    return true;
  } catch (error) {
    console.error('[SMTP Test] ❌ FALHA na conexão SMTP:', error.message);
    return false;
  }
}

/**
 * Função Principal
 */
async function checkAndSendNotifications() {
  console.log('--- [Email Job] Iniciando verificação ---');

  // 1. Testa a conexão primeiro
  const isConnected = await verifySmtpConnection();
  if (!isConnected) {
    throw new Error(`Não foi possível conectar ao servidor de e-mail ${process.env.EMAIL_HOST}`);
  }

  const now = startOfDay(new Date());
  const upcomingLimit = addDays(now, 30);

  console.log(`[Email Job] Data base: ${format(now, 'dd/MM/yyyy')}`);

  // 2. Busca TODOS os dispositivos ativos para filtrar no código (mais seguro para debug)
  const allDevices = await prisma.device.findMany({
    where: { isActive: true, nextPreventiveDate: { not: null } }
  });

  console.log(`[Email Job] Total de dispositivos analisados: ${allDevices.length}`);

  const overdueDevices = [];
  const upcomingDevices = [];

  allDevices.forEach(device => {
    const nextDate = startOfDay(new Date(device.nextPreventiveDate));
    
    // Log para debug de um dispositivo específico (opcional)
    // console.log(`Device: ${device.name}, Next: ${format(nextDate, 'dd/MM/yyyy')}`);

    if (isBefore(nextDate, now)) {
      overdueDevices.push(device);
    } else if (isBefore(nextDate, upcomingLimit) || isEqual(nextDate, upcomingLimit)) {
      upcomingDevices.push(device);
    }
  });

  console.log(`[Email Job] Resultados: ${overdueDevices.length} atrasados, ${upcomingDevices.length} próximos.`);

  if (overdueDevices.length === 0 && upcomingDevices.length === 0) {
    return { success: true, message: "Nenhum dispositivo precisa de alerta hoje." };
  }

  // 3. Monta o HTML
  let emailBody = `
    <div style="font-family: Arial;">
      <h2 style="color: #333;">Relatório TechFlow</h2>
      <p>Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
  `;

  if (overdueDevices.length > 0) {
    emailBody += `<h3 style="color: red;">🚨 Atrasadas (${overdueDevices.length})</h3><ul>`;
    overdueDevices.forEach(d => {
      emailBody += `<li><b>${d.name}</b> (${d.setor || 'S/ Setor'}) - Venceu: ${format(d.nextPreventiveDate, 'dd/MM/yyyy')}</li>`;
    });
    emailBody += `</ul>`;
  }

  if (upcomingDevices.length > 0) {
    emailBody += `<h3 style="color: orange;">⚠️ Próximas 30 Dias (${upcomingDevices.length})</h3><ul>`;
    upcomingDevices.forEach(d => {
      emailBody += `<li><b>${d.name}</b> (${d.setor || 'S/ Setor'}) - Vence: ${format(d.nextPreventiveDate, 'dd/MM/yyyy')}</li>`;
    });
    emailBody += `</ul>`;
  }

  emailBody += `</div>`;

  // 4. Envia
  console.log(`[Email Job] Enviando e-mail para: ${process.env.EMAIL_TO}...`);
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: `[TechFlow] Alerta de Manutenção - ${format(new Date(), 'dd/MM')}`,
      html: emailBody
    });
    console.log(`[Email Job] ✅ E-mail enviado! ID: ${info.messageId}`);
    return { success: true, message: "E-mail enviado com sucesso." };
  } catch (error) {
    console.error('[Email Job] ❌ Erro no sendMail:', error);
    throw error;
  }
}

module.exports = { checkAndSendNotifications };