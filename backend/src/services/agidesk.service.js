const axios = require('axios');
const https = require('https');

// 🟢 CONFIGURAÇÃO DIRETA À PROVA DE FALHAS (Igualzinho à documentação)
const tenant = "ptractor";
const appKey = "21127a3902c42118058054ea50d25f70"; // A sua chave exata da imagem/env
const customerId = "1";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// 🟢 A URL Base oficial .com
const AGIDESK_API = `https://ptractor.agidesk.com/api/v1`;

// Headers limpos em JSON como a documentação exige
const baseHeaders = {
    'X-Tenant-ID': tenant,
    'Content-Type': 'application/json'
    };

const getServiceId = (deviceType) => {
    const type = (deviceType || '').toLowerCase();
    if (type.includes('desktop')) return 182;
    if (type.includes('micro')) return 183;
    if (type.includes('notebook')) return 184;
    if (type.includes('switch')) return 174;
    if (type.includes('ap') || type.includes('wifi')) return 175;
    return 182; 
};

// ==========================================
// FUNÇÃO PARA CRIAR O TICKET
// ==========================================
exports.createPreventiveTicket = async (deviceName, deviceType, techIdentifier, deviceSector = 'Não informado', ipAddress = 'Não informado', actionType = 'Preventiva') => {
    try {
        const isEmail = techIdentifier.includes('@');
        const searchParams = isEmail ? { email: techIdentifier } : { username: techIdentifier };

        const isInfra = (deviceType || '').toLowerCase().match(/switch|ap|wifi/);
        let contactId = 1; 
        let contactName = techIdentifier;

        try {
            // A chave vai SEMPRE na URL em todas as chamadas
            const contactRes = await axios.get(`${AGIDESK_API}/contacts?app_key=${appKey}`, {
                params: searchParams, headers: baseHeaders, httpsAgent
            });
            if (contactRes.data && contactRes.data.length > 0) {
                contactId = contactRes.data[0].id;
                contactName = contactRes.data[0].title || techIdentifier;
            }
        } catch (err) {
            console.warn(`--> [AGIDESK] Aviso ao buscar contato:`, err.message);
        }

        let assetId = null;
        
        if (isInfra) {
            console.log(`--> [AGIDESK] Bypass de ativo para rede.`);
        } else if (deviceName.toUpperCase().includes('PC-TESTE')) {
            assetId = 2799; 
        } else {
            console.log(`--> [AGIDESK] Varredura profunda: "${deviceName}"...`);
            let page = 1;
            let maxPages = 50; 
            const normalizeName = (name) => String(name).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const searchTarget = normalizeName(deviceName);

            while (page <= maxPages && !assetId) {
                try {
                    const assetRes = await axios.get(`${AGIDESK_API}/assets?app_key=${appKey}`, {
                        params: { search: deviceName, title: deviceName, limit: 100, page: page }, 
                        headers: baseHeaders, 
                        httpsAgent
                    });
                    
                    const items = assetRes.data;
                    if (!items || items.length === 0) break;

                    const ativoEncontrado = items.find(item => item.title && normalizeName(item.title).includes(searchTarget));

                    if (ativoEncontrado) {
                        assetId = ativoEncontrado.id;
                        break;
                    }
                    if (items.length < 100) break;
                    page++;
                } catch (err) {
                    break;
                }
            }
        }

        try {
            const serviceId = getServiceId(deviceType);
            const tituloLimpo = `${actionType}: ${deviceName}`;
            const randomId = Math.floor(10000 + Math.random() * 90000);
            
            const corpoHtml = isInfra ? `
                <h3>🛠️ ${actionType} de Rede</h3>
                <p>Registro automático de atendimento gerado através do aplicativo <b>TechFlow</b>.</p>
                <hr>
                <blockquote>
                    <b>💻 Equipamento:</b> ${deviceName} (${deviceType})<br><br>
                    <b>🌐 Endereço IP:</b> ${ipAddress}<br><br>
                    <b>📍 Local / Setor:</b> ${deviceSector}<br><br>
                    <b>👤 Técnico Designado:</b> ${contactName}
                </blockquote>
                <hr>
                <p><small>ID Automação TechFlow: #${randomId}</small></p>
            ` : `
                <h3>🛠️ ${actionType} de Hardware</h3>
                <p>Registro automático de atendimento gerado através do aplicativo <b>TechFlow</b>.</p>
                <hr>
                <blockquote>
                    <b>💻 Equipamento:</b> ${deviceName} (${deviceType})<br><br>
                    <b>📍 Local / Setor:</b> ${deviceSector}<br><br>
                    <b>👤 Técnico Designado:</b> ${contactName}
                </blockquote>
                <hr>
                <p><small>ID Automação TechFlow: #${randomId}</small></p>
            `;

            // 🟢 4. FORMATO JSON PURO PARA A CRIAÇÃO
            const payload = {
                title: tituloLimpo,
                htmlcontent: corpoHtml,
                customers: Number(customerId),
                services: serviceId,
                contacts: contactId,
                responsible_id: contactId,
                forms: isInfra ? 31 : 34,
                customfields: []
            };

            if (assetId) {
                payload.assets = [assetId]; // Arrays em JSON
            }

            if (isInfra) {
                payload.customfields.push(
                    { form_id: 31, formfield_id: 209, value: tituloLimpo, text: tituloLimpo },
                    { form_id: 31, formfield_id: 210, value: deviceSector, text: deviceSector },
                    { form_id: 31, formfield_id: 211, value: actionType, text: actionType }
                );
            } else {
                payload.customfields.push(
                    { form_id: 34, formfield_id: 227, value: tituloLimpo, text: tituloLimpo },
                    { form_id: 34, formfield_id: 228, value: deviceSector, text: deviceSector },
                    { form_id: 34, formfield_id: 229, value: actionType, text: actionType }
                );
            }

            let response;
            try {
                // Postando como JSON com a app_key na URL
                response = await axios.post(`${AGIDESK_API}/issues?app_key=${appKey}`, payload, { headers: baseHeaders, httpsAgent });
                if (response.data && response.data.error) throw new Error(response.data.error_message);
            } catch (err) {
                const errorPayload = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                
                if (errorPayload.includes('requiredfield_asset')) {
                    throw new Error(`O Agidesk exige o vínculo obrigatório desta máquina, mas ela não foi encontrada na base de dados.`);
                }
                
                if (errorPayload.includes('invalid_teams_users')) {
                    delete payload.responsible_id; 
                    response = await axios.post(`${AGIDESK_API}/issues?app_key=${appKey}`, payload, { headers: baseHeaders, httpsAgent });
                    if (response.data && response.data.error) throw new Error(response.data.error_message);
                } else {
                    throw new Error(errorPayload); 
                }
            }

            return { ticketId: response.data.id, url: `https://${tenant}.agidesk.com/br/painel/atendimentos/todos` };

        } catch (err) {
            throw new Error(err.message);
        }
    } catch (error) { throw new Error(error.message); }
};

// ==========================================
// FUNÇÕES DE TIMER E CHECKLIST
// ==========================================
exports.startTicketTimer = async (ticketId) => {
    try {
        await axios.put(`${AGIDESK_API}/tasks/${ticketId}/start?app_key=${appKey}`, {}, {
            headers: baseHeaders, httpsAgent
        });
        return true;
    } catch (error) {
        return false;
    }
};

const solveAllChecklists = async (ticketId, headers) => {
    try {
        const checklistRes = await axios.get(`${AGIDESK_API}/tasks/${ticketId}/checklists?app_key=${appKey}`, { headers, httpsAgent });
        if (checklistRes.data && checklistRes.data.length > 0) {
            for (const list of checklistRes.data) {
                if (list.items && list.items.length > 0) {
                    for (const item of list.items) {
                        if (item.status !== 2) { 
                            await axios.put(`${AGIDESK_API}/tasks/${ticketId}/checklistitems/${item.id}?app_key=${appKey}`, { method: 'finish' }, {
                                headers: headers, httpsAgent
                            });
                        }
                    }
                }
            }
        }
    } catch (err) {}
};

exports.finishTicket = async (ticketId, relatorioText = "Manutenção preventiva concluída.") => {
    try {
        await solveAllChecklists(ticketId, baseHeaders);
        await new Promise(resolve => setTimeout(resolve, 3000));

        let isInfra = false;
        try {
            const ticketInfo = await axios.get(`${AGIDESK_API}/issues/${ticketId}?app_key=${appKey}`, { headers: baseHeaders, httpsAgent });
            if (ticketInfo.data) {
                if (ticketInfo.data.service_id === 174 || ticketInfo.data.service_id === 175) isInfra = true;
                if (ticketInfo.data.finished_at || ticketInfo.data.taskstatus_id === '4' || ticketInfo.data.taskstatus_id === '5' || ticketInfo.data.taskstatus_id === '6') {
                    return { success: true, message: "Ticket já estava encerrado." };
                }
            }
        } catch (e) {}

        const payload = {
            tasks: Number(ticketId),
            htmlcontent: relatorioText,
            privacy_id: 1,
            resolution: 1,
            duration: 1,
            blockfinish: 0,
            confirmservice: 0,
            serviceconfirmation: false,
            undefined: true
        };

        if (!isInfra) {
            payload.closure_id = 6;
            payload.facts = [2];
            payload.causes = [45];
            payload.actions = [3];
        }

        const response = await axios.post(`${AGIDESK_API}/comments?app_key=${appKey}`, payload, {
            headers: baseHeaders, httpsAgent
        });
        
        return response.data;
    } catch (error) {
        const errMsg = error.response?.data?.error_message || error.message;
        if (errMsg.toLowerCase().includes('permitid') || errMsg.toLowerCase().includes('status') || errMsg.toLowerCase().includes('encerrad')) {
            return { success: true, forced: true };
        }
        throw new Error(errMsg);
    }
};