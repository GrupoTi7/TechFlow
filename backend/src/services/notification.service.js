// src/services/notification.service.js
const { prisma } = require('../config/prismaClient');
const { addDays, format } = require('date-fns');
const nodemailer = require('nodemailer');

// Configuração do Nodemailer
// CORREÇÃO 1: Ajuste para ler EMAIL_PASSWORD corretamente
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // <-- CORRIGIDO (era EMAIL_PASS)
  },
  tls: {
      rejectUnauthorized: false 
  }
});

/**
 * Encontra dispositivos com preventivas atrasadas ou próximas.
 */
async function findDevicesNeedingAttention() {
  const now = new Date();
  
  // CORREÇÃO 2: Alterado de 7 para 30 dias para bater com a lógica do Frontend
  const upcomingLimit = addDays(now, 30); 

  const overdueDevices = await prisma.device.findMany({
    where: {
      isActive: true, // Apenas dispositivos ativos
      nextPreventiveDate: {
        lte: now, // Atrasadas (data <= hoje)
        not: null // Garante que não pega nulos
      }
    },
    orderBy: { nextPreventiveDate: 'asc' }
  });

  const upcomingDevices = await prisma.device.findMany({
    where: {
      isActive: true,
      nextPreventiveDate: {
        gt: now, // Maior que hoje
        lte: upcomingLimit, // Menor ou igual a 30 dias
        not: null
      }
    },
    orderBy: { nextPreventiveDate: 'asc' }
  });

  return { overdueDevices, upcomingDevices };
}

/**
 * Função Principal: Verifica e Envia (Renomeada para bater com o server.js)
 */
// CORREÇÃO 3: Renomeado para checkAndSendNotifications
async function checkAndSendNotifications() {
  console.log('--- [Email Service] Iniciando verificação de preventivas... ---');
  
  try {
    const { overdueDevices, upcomingDevices } = await findDevicesNeedingAttention();

    console.log(`[Email Service] Encontrados: ${overdueDevices.length} atrasados, ${upcomingDevices.length} próximos.`);

    if (overdueDevices.length === 0 && upcomingDevices.length === 0) {
      console.log('[Email Service] Nenhuma notificação necessária hoje.');
      return { success: true, message: "Nenhum alerta necessário." };
    }

    // Constrói o corpo do e-mail em HTML
    let emailBody = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #0056b3;">TechFlow - Alerta de Manutenção</h1>
        <p>Relatório gerado em: <strong>${format(new Date(), 'dd/MM/yyyy HH:mm')}</strong></p>
        <hr/>
    `;

    if (overdueDevices.length > 0) {
      emailBody += `
        <h2 style="color: #d9534f;">🚨 Preventivas Atrasadas (${overdueDevices.length})</h2>
        <ul>
          ${overdueDevices.map(d => `
            <li>
              <strong>${d.name}</strong> - Setor: ${d.setor || 'N/D'} <br/>
              <span style="color: red;">Venceu em: ${format(d.nextPreventiveDate, 'dd/MM/yyyy')}</span>
            </li>
          `).join('')}
        </ul>
      `;
    }

    if (upcomingDevices.length > 0) {
      emailBody += `
        <h2 style="color: #f0ad4e;">⚠️ Próximas Preventivas (30 Dias) (${upcomingDevices.length})</h2>
        <ul>
          ${upcomingDevices.map(d => `
            <li>
              <strong>${d.name}</strong> - Setor: ${d.setor || 'N/D'} <br/>
              <span>Vence em: ${format(d.nextPreventiveDate, 'dd/MM/yyyy')}</span>
            </li>
          `).join('')}
        </ul>
      `;
    }

    emailBody += `
        <hr/>
        <p style="font-size: 12px; color: #777;">Este é um e-mail automático do sistema TechFlow.</p>
      </div>
    `;

    // Configurações do e-mail
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO, 
      subject: `[TechFlow] Alerta: ${overdueDevices.length} Atrasadas | ${upcomingDevices.length} Próximas`,
      html: emailBody,
    };

    // Envia o e-mail
    let info = await transporter.sendMail(mailOptions);
    console.log('[Email Service] E-mail enviado com sucesso! ID:', info.messageId);
    return { success: true, message: "E-mail enviado." };

  } catch (error) {
    console.error('[Email Service] Erro crítico ao enviar e-mail:', error);
    throw error;
  }
}

module.exports = { checkAndSendNotifications };

//correção 4