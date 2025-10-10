const glpiService = require('../services/glpi.service');

/**
 * Controlador para operações de sincronização
 */
class SyncController {
  /**
   * Manipula requisições de sincronização
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   */
  async handleSync(req, res) {
    try {
      console.log('Recebida requisição de sincronização');
      
      // Extrair parâmetros da requisição
      const { force = false } = req.body;
      
      // Validar parâmetros se necessário
      if (typeof force !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Parâmetro "force" deve ser um boolean'
        });
      }

      // Executar sincronização
      const result = await glpiService.syncDevicesFromGLPI({ force });

      // Determinar status HTTP baseado no resultado
      const statusCode = result.success ? 200 : 500;

      // Retornar resposta
      res.status(statusCode).json({
        success: result.success,
        message: result.message,
        data: {
          devicesProcessed: result.devicesProcessed,
          devicesCreated: result.devicesCreated,
          devicesUpdated: result.devicesUpdated,
          errors: result.errors,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Erro no controlador de sincronização:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
      });
    }
  }

  /**
   * Obtém o status da última sincronização
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   */
  async getSyncStatus(req, res) {
    try {
      // TODO: Implementar lógica para obter status da última sincronização
      // Pode ser útil para verificar quando foi a última sincronização
      
      res.json({
        success: true,
        message: 'Status da sincronização obtido com sucesso',
        data: {
          lastSync: null, // TODO: Implementar
          nextSync: null, // TODO: Implementar
          isSyncNeeded: true
        }
      });

    } catch (error) {
      console.error('Erro ao obter status da sincronização:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro ao obter status da sincronização',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
      });
    }
  }
}

module.exports = new SyncController();
