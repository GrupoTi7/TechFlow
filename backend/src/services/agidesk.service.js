const axios = require('axios');
const https = require('https');

// Limpeza das variáveis do .env
const tenant = (process.env.AGIDESK_TENANT || 'ptractor').replace(/['"]+/g, '').trim();
const appKey = (process.env.AGIDESK_APP_KEY || '11d74d38dc2cf9ad1acdcee503e28206').replace(/['"]+/g, '').trim(); 
const customerId = (process.env.AGIDESK_CUSTOMER_ID || '1').replace(/['"]+/g, '').trim();

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const AGIDESK_API = `https://${tenant}.agidesk.com.br/api/v1`;

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
        
        const agideskHeaders = { 
            'X-Tenant-ID': tenant,
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        const isInfra = (deviceType || '').toLowerCase().match(/switch|ap|wifi/);
        let contactId = 1; 
        let contactName = techIdentifier;

        try {
            const contactRes = await axios.get(`${AGIDESK_API}/contacts?app_key=${appKey}`, {
                params: searchParams, headers: { 'X-Tenant-ID': tenant }, httpsAgent
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
            try {
                console.log(`--> [AGIDESK] Procurando máquina: "${deviceName}"...`);
                
                // 🟢 CORREÇÃO CRÍTICA: Voltámos a usar 'title' em vez de 'search'
                const assetRes = await axios.get(`${AGIDESK_API}/assets?app_key=${appKey}`, {
                    params: { title: deviceName }, headers: { 'X-Tenant-ID': tenant }, httpsAgent
                });
                
                console.log(`--> [AGIDESK] A busca retornou ${assetRes.data ? assetRes.data.length : 0} itens da API.`);
                
                if (assetRes.data && assetRes.data.length > 0) {
                    const normalizeName = (name) => String(name).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    const searchTarget = normalizeName(deviceName);

                    const ativoEncontrado = assetRes.data.find(item => {
                        return item.title && normalizeName(item.title).includes(searchTarget);
                    });

                    if (ativoEncontrado) {
                        assetId = ativoEncontrado.id;
                        console.log(`--> [AGIDESK] SUCESSO: Máquina encontrada! ID Agidesk = ${assetId}`);
                    } else {
                        console.log(`--> [AGIDESK] Máquina NÃO encontrada na lista recebida.`);
                    }
                }
            } catch (err) {
                console.error(`--> [AGIDESK] Erro de rede ou permissão ao pesquisar máquina:`, err.message);
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

            const params = new URLSearchParams();
            params.append('title', tituloLimpo); 
            params.append('htmlcontent', corpoHtml); 
            params.append('customers', customerId); 
            params.append('services', serviceId);   
            params.append('contacts', contactId);
            params.append('responsible_id', contactId); 

            if (assetId) params.append('assets[]', assetId); 

            if (isInfra) {
                params.append('forms', 31); 
                params.append('customfields[0][form_id]', 31);
                params.append('customfields[0][formfield_id]', 209);
                params.append('customfields[0][value]', tituloLimpo); 
                params.append('customfields[0][text]', tituloLimpo);
                params.append('customfields[1][form_id]', 31);
                params.append('customfields[1][formfield_id]', 210);
                params.append('customfields[1][value]', deviceSector);
                params.append('customfields[1][text]', deviceSector);
                params.append('customfields[2][form_id]', 31);
                params.append('customfields[2][formfield_id]', 211);
                params.append('customfields[2][value]', actionType);
                params.append('customfields[2][text]', actionType);
            } else {
                params.append('forms', 34); 
                params.append('customfields[0][form_id]', 34);
                params.append('customfields[0][formfield_id]', 227);
                params.append('customfields[0][value]', tituloLimpo); 
                params.append('customfields[0][text]', tituloLimpo);
                params.append('customfields[1][form_id]', 34);
                params.append('customfields[1][formfield_id]', 228);
                params.append('customfields[1][value]', deviceSector);
                params.append('customfields[1][text]', deviceSector);
                params.append('customfields[2][form_id]', 34);
                params.append('customfields[2][formfield_id]', 229);
                params.append('customfields[2][value]', actionType);
                params.append('customfields[2][text]', actionType);
            }

            let response;
            const axiosConfig = { headers: agideskHeaders, httpsAgent };

            try {
                response = await axios.post(`${AGIDESK_API}/issues?app_key=${appKey}`, params, axiosConfig);
                if (response.data && response.data.error) throw new Error(response.data.error_message);
            } catch (err) {
                const errorPayload = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                
                if (errorPayload.includes('requiredfield_asset')) {
                    throw new Error(`O Agidesk exige que a máquina "${deviceName}" seja vinculada a este chamado, mas a API não conseguiu encontrá-la no inventário.`);
                }
                
                if (errorPayload.includes('invalid_teams_users')) {
                    console.warn(`--> [AGIDESK] Bypass de responsável acionado...`);
                    params.delete('responsible_id'); 
                    response = await axios.post(`${AGIDESK_API}/issues?app_key=${appKey}`, params, axiosConfig);
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
        await axios.put(`${AGIDESK_API}/tasks/${ticketId}/start?app_key=${appKey}`, null, {
            headers: { 'X-Tenant-ID': tenant }, httpsAgent
        });
        console.log(`--> [AGIDESK] Play executado com sucesso no ticket ${ticketId}.`);
        return true;
    } catch (error) {
        console.warn(`⚠️ [AGIDESK] Agidesk bloqueou o Play.`);
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
                            const params = new URLSearchParams();
                            params.append('method', 'finish'); 
                            await axios.put(`${AGIDESK_API}/tasks/${ticketId}/checklistitems/${item.id}?app_key=${appKey}`, params, {
                                headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' }, httpsAgent
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
        const agideskHeaders = { 'X-Tenant-ID': tenant };
        
        await solveAllChecklists(ticketId, agideskHeaders);
        await new Promise(resolve => setTimeout(resolve, 3000));

        let isInfra = false;
        
        try {
            const ticketInfo = await axios.get(`${AGIDESK_API}/issues/${ticketId}?app_key=${appKey}`, { headers: agideskHeaders, httpsAgent });
            
            if (ticketInfo.data) {
                if (ticketInfo.data.service_id === 174 || ticketInfo.data.service_id === 175) {
                    isInfra = true;
                }
                
                if (ticketInfo.data.finished_at || ticketInfo.data.taskstatus_id === '4' || ticketInfo.data.taskstatus_id === '5' || ticketInfo.data.taskstatus_id === '6') {
                    return { success: true, message: "Ticket já estava encerrado." };
                }
            }
        } catch (e) {}

        const params = new URLSearchParams();
        params.append('tasks', ticketId); 
        params.append('htmlcontent', relatorioText); 
        params.append('privacy_id', '1'); 
        params.append('resolution', '1'); 
        
        if (!isInfra) {
            params.append('closure_id', '6'); 
            params.append('facts[]', '2');    
            params.append('causes[]', '45');  
            params.append('actions[]', '3');  
        }

        params.append('duration', '1'); 
        params.append('blockfinish', '0'); 
        params.append('confirmservice', '0');
        params.append('serviceconfirmation', 'false');
        params.append('undefined', 'true'); 

        const response = await axios.post(`${AGIDESK_API}/comments?app_key=${appKey}`, params, {
            headers: { ...agideskHeaders, 'Content-Type': 'application/x-www-form-urlencoded' }, httpsAgent
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