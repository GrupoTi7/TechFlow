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
 * Função Principal (Verificação Diária Automática)
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

/**
 * 🟢 NOVA FUNÇÃO: Disparo manual de cobrança de SLA (Command Center)
 */
async function sendActionPlanReminder(planName, totalPending, daysLeft) {
  console.log(`[Email Job] Disparando cobrança manual para a campanha: ${planName}`);

  const isConnected = await verifySmtpConnection();
  if (!isConnected) throw new Error(`Falha na conexão SMTP ao tentar enviar cobrança.`);

  const systemLink = "https://10.20.2.75/login";
  const reportDate = format(new Date(), 'dd/MM/yyyy HH:mm');

  // Lógica de cores baseada na urgência
  let statusHTML = '';
  if (daysLeft < 0) {
      statusHTML = `<span style="color: #e03131; font-weight: bold;">ATRASADO EM ${Math.abs(daysLeft)} DIAS (SLA QUEBRADO)</span>`;
  } else if (daysLeft <= 3) {
      statusHTML = `<span style="color: #e67e22; font-weight: bold;">CRÍTICO - Vence em ${daysLeft} dias</span>`;
  } else {
      statusHTML = `<span style="color: #0003d9; font-weight: bold;">No prazo (${daysLeft} dias restantes)</span>`;
  }

  const emailBody = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin: 0 auto;">
        <div style="background-color: #0003d9; padding: 20px; color: white; text-align: center;">
            <h2 style="margin: 0; letter-spacing: 1px;">⚙️ TechFlow Command Center</h2>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Alerta de Prioridade Operacional</p>
        </div>
        
        <div style="padding: 30px 20px;">
            <p style="font-size: 16px; margin-top: 0;">Olá, Equipe de Manutenção,</p>
            <p style="font-size: 16px; line-height: 1.5;">O gestor da operação acabou de emitir um alerta de prioridade para a campanha de preventivas <b>"${planName}"</b>.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-left: 5px solid #0003d9; margin: 25px 0; border-radius: 4px;">
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin-bottom: 12px; font-size: 16px;">
                        📉 <b>Máquinas Pendentes:</b> <span style="font-size: 20px; color: #e03131; font-weight: 900;">${totalPending}</span> equipamentos
                    </li>
                    <li style="font-size: 16px;">
                        ⏱️ <b>Status do Prazo:</b> ${statusHTML}
                    </li>
                </ul>
            </div>
            
            <p style="font-size: 15px; color: #555;">Por favor, direcionem esforços para a conclusão destas tarefas a fim de manter a saúde da operação em 100%.</p>
            
            <div style="text-align: center; margin-top: 35px;">
                <a href="${systemLink}" style="background-color: #0003d9; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Acessar Painel TechFlow</a>
            </div>
        </div>
        
        <div style="background-color: #f1f3f5; padding: 15px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #ddd;">
            <p style="margin: 0;">Relatório gerado em: ${reportDate}</p>
            <p style="margin: 5px 0 0 0;">Este é um e-mail automático disparado pelo módulo gerencial.</p>
        </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"TechFlow Alerts" <support@ptractor.com.br>',
      to: process.env.EMAIL_TO || 'ti@ptractor.com.br',
      subject: `[Urgente] Ação Requerida - Campanha: ${planName}`,
      html: emailBody
    });
    console.log(`[Email Job] ✅ Cobrança enviada com sucesso! ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('[Email Job] ❌ Erro ao enviar cobrança:', error);
    throw error;
  }
}

module.exports = { 
  checkAndSendNotifications,
  sendActionPlanReminder 
};