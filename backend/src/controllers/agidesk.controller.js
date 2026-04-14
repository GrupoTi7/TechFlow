const agideskService = require('../services/agidesk.service');

// ==========================================
// ROTA 1: CRIAR O TICKET
// ==========================================
exports.startTicket = async (req, res) => {
    try {
        // 🟢 AQUI ESTÁ O DETALHE: O Carteiro agora pega o 'actionType' do Frontend
        console.log("==> DADOS RECEBIDOS DO FRONTEND:", req.body);

        const { deviceName, deviceType, techIdentifier, deviceSector, ipAddress, actionType } = req.body;
        
        const identifier = techIdentifier || (req.user && (req.user.email || req.user.username)); 

        if (!identifier) {
            return res.status(400).json({ error: "Identificação do técnico não encontrada." });
        }

        console.log(`--> [AGIDESK] Iniciando ${actionType || 'Preventiva'} para ${deviceName} (${deviceType}) no setor ${deviceSector} - Técnico: ${identifier}`);

        // 🟢 E ENTREGA AQUI NO FINAL (o actionType é a última variável):
        const result = await agideskService.createPreventiveTicket(deviceName, deviceType, identifier, deviceSector, ipAddress, actionType);
        
        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Erro no Agidesk Controller (Start):", error.message);
        res.status(500).json({ error: 'Falha ao integrar com Agidesk', message: error.message });
    }
};

// ==========================================
// ROTA 2: DAR PLAY NO CRONÔMETRO
// ==========================================
exports.playTicket = async (req, res) => {
    try {
        const { ticketId } = req.body;
        
        if (!ticketId) {
            return res.status(400).json({ error: "ID do ticket não fornecido." });
        }

        console.log(`--> [AGIDESK] Solicitando Play no ticket ID: ${ticketId}`);
        const result = await agideskService.startTicketTimer(ticketId);
        
        res.status(200).json({ success: true, result });
    } catch (error) {
        console.error("❌ Erro no Agidesk Controller (Play):", error.message);
        res.status(500).json({ error: 'Falha ao iniciar cronômetro', message: error.message });
    }
};

// ==========================================
// ROTA 3: ENCERRAR O TICKET
// ==========================================
exports.finishTicket = async (req, res) => {
    try {
        const { ticketId, relatorioText } = req.body;
        
        if (!ticketId) {
            return res.status(400).json({ error: "ID do ticket não fornecido." });
        }

        console.log(`--> [AGIDESK] Solicitando Encerramento do ticket ID: ${ticketId}`);
        const result = await agideskService.finishTicket(ticketId, relatorioText);
        
        res.status(200).json({ success: true, result });
    } catch (error) {
        console.error("❌ Erro no Agidesk Controller (Finish):", error.message);
        res.status(500).json({ error: 'Falha ao encerrar ticket', message: error.message });
    }
};