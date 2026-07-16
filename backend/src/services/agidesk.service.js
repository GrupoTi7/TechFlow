const axios = require('axios');
const https = require('https');

// Limpeza das variáveis
const tenant = (process.env.AGIDESK_TENANT || 'ptractor').replace(/['"]+/g, '').trim();
const appKey = (process.env.AGIDESK_TOKEN || process.env.AGIDESK_APP_KEY || '21127a3902c42118058054ea50d25f70').replace(/['"]+/g, '').trim(); 
const customerId = (process.env.AGIDESK_CUSTOMER_ID || '1').replace(/['"]+/g, '').trim();

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// A Hiperligação blindada
const AGIDESK_API = `https://${tenant}.agidesk.com.br/api/v1`;

// 🟢 MUDANÇA CRUCIAL: Agora a comunicação é puramente JSON! 
const baseHeaders = {
    'X-Tenant-ID': tenant,
    'Authorization': `Bearer ${appKey}`, 
    'Content-Type': 'application/json', // O CloudFront adora JSON!
    'Accept': 'application/json'
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
            const contactRes = await axios.get(`${AGIDESK_API}/contacts`, {
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
            console.log(`--> [AGIDESK] 2. Equipamento de Rede. Bypass de ativo.`);
        } else if (deviceName.toUpperCase().includes('PC-TESTE')) {
            assetId = 2799; 
            console.log(`--> [AGIDESK] 2. Ativo PC-TESTE fixado (ID: 2799)`);
        } else {
            console.log(`--> [AGIDESK] Iniciando Varredura Profunda pela máquina: "${deviceName}"...`);
            
            let page = 1;
            let maxPages = 50; 
            
            const normalizeName = (name) => String(name).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const searchTarget = normalizeName(deviceName);

            while (page <= maxPages && !assetId) {
                try {
                    const assetRes = await axios.get(`${AGIDESK_API}/assets`, {
                        params: { search: deviceName, title: deviceName, limit: 100, page: page }, 
                        headers: baseHeaders, 
                        httpsAgent
                    });
                    
                    const items = assetRes.data;
                    
                    if (!items || items.length === 0) break;

                    const ativoEncontrado = items.find(item => {
                        return item.title && normalizeName(item.title).includes(searchTarget);
                    });

                    if (ativoEncontrado) {
                        assetId = ativoEncontrado.id;
                        console.log(`--> [AGIDESK] 🎯 SUCESSO: Máquina encontrada! ID Agidesk = ${assetId}`);
                        break;
                    }

                    if (items.length < 100) break;
                    page++;
                } catch (err) {
                    console.error(`--> [AGIDESK] Erro de rede ao pesquisar na página ${page}:`, err.message);
                    break;
                }
            }
        }

        try {
            const serviceId = getServiceId(deviceType);
            const tituloLimpo = `${actionType}: ${deviceName}`;
            const randomId = Math.floor(10000 + Math.random() * 90000);
            
            const corpoHtml = isInfra ? `
                <p><b>${actionType} de Rede (Via TechFlow)</b></p>
                <ul>
                    <li><b>Equipamento:</b> ${deviceName} (${deviceType})</li>
                    <li><b>Endereço IP:</b> ${ipAddress}</li>
                    <li><b>Local:</b> ${deviceSector}</li>
                    <li><b>Técnico Registrador:</b> ${contactName}</li>
                </ul>
                <div style="display:none;">#${randomId}</div>
            ` : `
                <p><b>${actionType} de Hardware (Via TechFlow)</b></p>
                <ul>
                    <li><b>Equipamento:</b> ${deviceName} (${deviceType})</li>
                    <li><b>Local:</b> ${deviceSector}</li>
                    <li><b>Técnico Registrador:</b> ${contactName}</li>
                </ul>
                <div style="display:none;">#${randomId}</div>
            `;

            // 🟢 A MÁGICA ACONTECE AQUI: JSON Puro! (Adeus WAF Blocking)
            const payload = {
                title: tituloLimpo,
                htmlcontent: corpoHtml,
                customers: customerId,
                services: serviceId,
                contacts: contactId,
                responsible_id: contactId,
                assets: assetId ? [assetId] : undefined,
                forms: isInfra ? 31 : 34,
                customfields: []
            };

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
                // Removemos o envio forçado de nulos no JSON
                if (!payload.assets) delete payload.assets;

                response = await axios.post(`${AGIDESK_API}/issues`, payload, { headers: baseHeaders, httpsAgent });
                if (response.data && response.data.error) throw new Error(response.data.error_message);
            } catch (err) {
                const errorPayload = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                
                if (errorPayload.includes('requiredfield_asset')) {
                    throw new Error(`O Agidesk exige o vínculo obrigatório desta máquina, mas ela não foi encontrada na base de dados.`);
                }
                if (errorPayload.includes('invalid_teams_users')) {
                    console.warn(`--> [AGIDESK] Bypass de responsável acionado...`);
                    delete payload.responsible_id; 
                    response = await axios.post(`${AGIDESK_API}/issues`, payload, { headers: baseHeaders, httpsAgent });
                    if (response.data && response.data.error) throw new Error(response.data.error_message);
                } else {
                    throw new Error(errorPayload); 
                }
            }

            return { ticketId: response.data.id, url: `https://${tenant}.agidesk.com.br/br/painel/atendimentos/todos` };
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
        await axios.put(`${AGIDESK_API}/tasks/${ticketId}/start`, {}, {
            headers: baseHeaders, httpsAgent
        });
        return true;
    } catch (error) {
        console.warn(`⚠️ [AGIDESK] Agidesk bloqueou o Play.`);
        return false;
    }
};

const solveAllChecklists = async (ticketId, headers) => {
    try {
        const checklistRes = await axios.get(`${AGIDESK_API}/tasks/${ticketId}/checklists`, { headers, httpsAgent });
        if (checklistRes.data && checklistRes.data.length > 0) {
            for (const list of checklistRes.data) {
                if (list.items && list.items.length > 0) {
                    for (const item of list.items) {
                        if (item.status !== 2) { 
                            await axios.put(`${AGIDESK_API}/tasks/${ticketId}/checklistitems/${item.id}`, { method: 'finish' }, {
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
            const ticketInfo = await axios.get(`${AGIDESK_API}/issues/${ticketId}`, { headers: baseHeaders, httpsAgent });
            if (ticketInfo.data) {
                if (ticketInfo.data.service_id === 174 || ticketInfo.data.service_id === 175) isInfra = true;
                if (ticketInfo.data.finished_at || ticketInfo.data.taskstatus_id === '4' || ticketInfo.data.taskstatus_id === '5' || ticketInfo.data.taskstatus_id === '6') {
                    return { success: true, message: "Ticket já estava encerrado." };
                }
            }
        } catch (e) {}

        const payload = {
            tasks: ticketId,
            htmlcontent: relatorioText,
            privacy_id: '1',
            resolution: '1',
            duration: '1',
            blockfinish: '0',
            confirmservice: '0',
            serviceconfirmation: 'false',
            undefined: 'true'
        };

        if (!isInfra) {
            payload.closure_id = '6';
            payload.facts = ['2'];
            payload.causes = ['45'];
            payload.actions = ['3'];
        }

        const response = await axios.post(`${AGIDESK_API}/comments`, payload, {
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