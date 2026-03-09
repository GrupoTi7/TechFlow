// src/services/agidesk.service.js
const axios = require('axios');
const qs = require('qs');
const { prisma } = require('../config/prismaClient'); 

// Configuração do Axios para o Agidesk
const agideskApi = axios.create({
    baseURL: process.env.AGIDESK_API_URL,
    headers: {
        // A documentação exige urlencoded e X-Tenant-ID
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Tenant-ID': process.env.AGIDESK_TENANT_ID,
        'Authorization': `Bearer ${process.env.AGIDESK_APP_KEY}`
    }
});

exports.createPreventiveTicket = async (deviceId, userName) => {
    try {
        // 1. Busca os dados do equipamento no seu banco de dados
        const device = await prisma.device.findUnique({
            where: { id: deviceId },
            include: { sector: true }
        });

        if (!device) throw new Error("Dispositivo não encontrado.");

        const setorNome = device.sector?.name || device.setorName || 'Não informado';

        // 2. Monta os dados obrigatórios conforme a documentação
        const ticketData = {
            customers: process.env.AGIDESK_DEFAULT_CUSTOMER_ID,
            contacts: process.env.AGIDESK_DEFAULT_CONTACT_ID,
            services: process.env.AGIDESK_PREVENTIVE_SERVICE_ID,
            title: `[Preventiva] ${device.name} - ${setorNome}`,
            htmlcontent: `
                <p><strong>Manutenção Preventiva Iniciada</strong></p>
                <ul>
                    <li><strong>Equipamento:</strong> ${device.name}</li>
                    <li><strong>Setor:</strong> ${setorNome}</li>
                    <li><strong>Técnico:</strong> ${userName}</li>
                </ul>
                <p><em>Aberto automaticamente pelo TechFlow.</em></p>
            `
        };

        // 3. O Agidesk exige form-urlencoded, então usamos a biblioteca 'qs' do Node para converter o objeto
        const encodedData = qs.stringify(ticketData);

        // 4. Dispara a requisição POST para /issues
        const response = await agideskApi.post('/issues', encodedData);

        // Retorna os dados do ticket criado (ID, etc)
        return response.data;

    } catch (error) {
        console.error("Erro na integração Agidesk:", error.response?.data || error.message);
        throw new Error("Falha ao abrir chamado no Agidesk.");
    }
};