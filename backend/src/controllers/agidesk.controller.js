// src/controllers/agidesk.controller.js
const agideskService = require('../services/agidesk.service');

exports.startTicket = async (req, res) => {
    try {
        const { deviceId } = req.body;
        
        // Pega o nome do usuário logado (assumindo que seu middleware coloca 'req.user')
        const userName = req.user.name || 'Técnico';

        // Chama o serviço
        const ticket = await agideskService.createPreventiveTicket(deviceId, userName);

        res.json({
            success: true,
            message: "Atendimento iniciado com sucesso!",
            ticketId: ticket.id // Retorna o ID gerado pelo Agidesk
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};