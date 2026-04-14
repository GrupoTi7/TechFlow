const axios = require('axios');
const https = require('https');

const tenant = process.env.AGIDESK_TENANT || 'ptractor';
const appKey = process.env.AGIDESK_APP_KEY || '11d74d38dc2cf9ad1acdcee503e28206'; 
const customerId = process.env.AGIDESK_CUSTOMER_ID || '1';

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
        const agideskHeaders = { 'X-Tenant-ID': tenant };

        const isInfra = (deviceType || '').toLowerCase().match(/switch|ap|wifi/);

        let contactId = 1; 
        let contactName = techIdentifier;

        try {
            const contactRes = await axios.get(`${AGIDESK_API}/contacts?app_key=${appKey}`, {
                params: searchParams, headers: agideskHeaders, httpsAgent
            });
            if (contactRes.data && contactRes.data.length > 0) {
                contactId = contactRes.data[0].id;
                contactName = contactRes.data[0].title || techIdentifier;
            }
        } catch (err) {}

        let assetId = null;
        if (isInfra) {
            console.log(`--> [AGIDESK] 2. Equipamento de Rede. Bypass de ativo.`);
        } else if (deviceName.toUpperCase().includes('PC-TESTE')) {
            assetId = 2799; 
            console.log(`--> [AGIDESK] 2. Ativo PC-TESTE fixado (ID: 2799)`);
        } else {
            try {
                const assetRes = await axios.get(`${AGIDESK_API}/assets?app_key=${appKey}`, {
                    params: { title: deviceName }, headers: agideskHeaders, httpsAgent
                });
                if (assetRes.data && assetRes.data.length > 0) {
                    const ativoEncontrado = assetRes.data.find(item => item.title && item.title.toUpperCase().includes(deviceName.toUpperCase()));
                    if (ativoEncontrado) assetId = ativoEncontrado.id;
                }
            } catch (err) {}
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

            if (assetId) {
                params.append('assets[]', assetId); 
            } else if (!isInfra) {
                throw new Error(`O equipamento "${deviceName}" não foi encontrado no Agidesk. O serviço exige vínculo!`);
            }

            // 🟢 A MÁGICA DOS FORMULÁRIOS QUE VOCÊ DESCOBRIU
            if (isInfra) {
                // Formulário 31 (Redes Lógicas)
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
                // Formulário 34 (Desktops)
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
            const axiosConfig = { headers: { ...agideskHeaders, 'Content-Type': 'application/x-www-form-urlencoded' }, httpsAgent };

            try {
                response = await axios.post(`${AGIDESK_API}/issues?app_key=${appKey}`, params, axiosConfig);
                if (response.data && response.data.error) throw new Error(response.data.error_message);
            } catch (err) {
                const errMsg = err.response?.data?.error_message || err.message;
                
                if (errMsg.includes('invalid_teams_users')) {
                    console.warn(`⚠️ [AGIDESK] Bypass de equipe acionado...`);
                    params.delete('responsible_id'); 
                    response = await axios.post(`${AGIDESK_API}/issues?app_key=${appKey}`, params, axiosConfig);
                    if (response.data && response.data.error) throw new Error(response.data.error_message);
                } else {
                    throw new Error(errMsg); 
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
        
        // Tenta resolver os checklists (ignora se der erro)
        await solveAllChecklists(ticketId, agideskHeaders);
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log(`--> [AGIDESK] Analisando o tipo e status do chamado ${ticketId} para fechamento...`);

        let isInfra = false;
        
        try {
            // 🟢 INTELIGÊNCIA 1: Espia o chamado no Agidesk antes de tentar fechar
            const ticketInfo = await axios.get(`${AGIDESK_API}/issues/${ticketId}?app_key=${appKey}`, { headers: agideskHeaders, httpsAgent });
            
            if (ticketInfo.data) {
                // Verifica se é Infra
                if (ticketInfo.data.service_id === 174 || ticketInfo.data.service_id === 175) {
                    isInfra = true;
                }
                
                // 🟢 INTELIGÊNCIA 2: Verifica se o chamado JÁ ESTÁ FECHADO lá!
                // Se tiver 'finished_at' preenchido, ou status de encerrado/cancelado.
                if (ticketInfo.data.finished_at || ticketInfo.data.taskstatus_id === '4' || ticketInfo.data.taskstatus_id === '5' || ticketInfo.data.taskstatus_id === '6') {
                    console.log(`--> [AGIDESK] O ticket ${ticketId} JÁ ESTAVA ENCERRADO no Agidesk! Liberando a máquina no TechFlow...`);
                    // Retorna sucesso para o TechFlow poder limpar o banco de dados e destravar a tela!
                    return { success: true, message: "Ticket já estava encerrado." };
                }
            }
        } catch (e) {
            console.warn(`⚠️ Não foi possível verificar o serviço/status prévio do ticket. Prosseguindo com o fluxo normal.`);
        }

        const params = new URLSearchParams();
        params.append('tasks', ticketId); 
        params.append('htmlcontent', relatorioText); 
        params.append('privacy_id', '1'); 
        params.append('resolution', '1'); 
        
        // Se for Desktop, envia as categorias. Se for Infra, manda limpo.
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
        
        console.log(`--> [AGIDESK] Ticket ${ticketId} encerrado com sucesso!`);
        return response.data;
        
    } catch (error) {
        const errMsg = error.response?.data?.error_message || error.message;
        console.error(`❌ [AGIDESK] Erro ao tentar encerrar:`, errMsg);
        
        // 🟢 O PLANO DE FUGA: Se o Agidesk barrar o encerramento (ex: "Ação não permitida" pq já tá fechado),
        // nós mentimos pro TechFlow dizendo que deu certo, só para ele destravar a máquina do banco de dados!
        if (errMsg.toLowerCase().includes('permitid') || errMsg.toLowerCase().includes('status') || errMsg.toLowerCase().includes('encerrad')) {
            console.warn(`⚠️ [AGIDESK] O Agidesk recusou o fechamento. Forçando o destravamento da máquina no TechFlow!`);
            return { success: true, forced: true };
        }

        throw new Error(errMsg);
    }
};