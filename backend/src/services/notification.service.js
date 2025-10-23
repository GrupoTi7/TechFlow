// src/services/notification.service.js
const { prisma } = require('../config/prismaClient');
const { addDays, format } = require('date-fns');
const nodemailer = require('nodemailer');

// Configuração do Nodemailer (lê as variáveis do .env)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para outras portas
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Desativa a verificação de certificado (útil para alguns ambientes)
  // Atenção: Em produção, considere configurar certificados corretamente.
  tls: {
      rejectUnauthorized: false 
  }
});

/**
 * Encontra dispositivos com preventivas atrasadas ou próximas.
 */
async function findDevicesNeedingAttention() {
  const now = new Date();
  const upcomingLimit = addDays(now, 7); // Considera "próximas" as que vencem nos próximos 7 dias

  const overdueDevices = await prisma.device.findMany({
    where: {
      nextPreventiveDate: {
        lte: now // Atrasadas (data <= hoje)
      }
    },
    orderBy: { nextPreventiveDate: 'asc' }
  });

  const upcomingDevices = await prisma.device.findMany({
    where: {
      nextPreventiveDate: {
        gt: now, // Próximas (data > hoje)
        lte: upcomingLimit // E data <= próximos 7 dias
      }
    },
    orderBy: { nextPreventiveDate: 'asc' }
  });

  return { overdueDevices, upcomingDevices };
}

/**
 * Envia um e-mail de notificação com a lista de dispositivos.
 */
async function sendNotificationEmail() {
  console.log('Verificando preventivas para notificação...');
  const { overdueDevices, upcomingDevices } = await findDevicesNeedingAttention();

  if (overdueDevices.length === 0 && upcomingDevices.length === 0) {
    console.log('Nenhuma preventiva atrasada ou próxima encontrada. Nenhum e-mail enviado.');
    return;
  }

  // Constrói o corpo do e-mail em HTML
  let emailBody = `
    <h1>Alerta de Manutenção Preventiva - TechFlow</h1>
    <p>Relatório gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
  `;

  if (overdueDevices.length > 0) {
    emailBody += `
      <h2 style="color: red;">🚨 Preventivas Atrasadas (${overdueDevices.length})</h2>
      <ul>
        ${overdueDevices.map(d => `<li>${d.name} (Venceu em: ${format(d.nextPreventiveDate, 'dd/MM/yyyy')})</li>`).join('')}
      </ul>
      <hr/>
    `;
  }

  if (upcomingDevices.length > 0) {
    emailBody += `
      <h2 style="color: orange;">⚠️ Preventivas Próximas (${upcomingDevices.length})</h2>
      <ul>
        ${upcomingDevices.map(d => `<li>${d.name} (Vence em: ${format(d.nextPreventiveDate, 'dd/MM/yyyy')})</li>`).join('')}
      </ul>
    `;
  }

  // Configurações do e-mail
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO, // Lê a lista de destinatários do .env
    subject: `Alerta de Preventivas TechFlow (${overdueDevices.length} Atrasadas, ${upcomingDevices.length} Próximas)`,
    html: emailBody,
  };

  try {
    // Envia o e-mail
    let info = await transporter.sendMail(mailOptions);
    console.log('E-mail de notificação enviado com sucesso! Message ID:', info.messageId);
  } catch (error) {
    console.error('Erro ao enviar e-mail de notificação:', error);
  }
}

module.exports = { sendNotificationEmail };