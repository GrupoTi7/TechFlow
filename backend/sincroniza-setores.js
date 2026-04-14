const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// A sua lista exata de setores
const setoresAdministrativos = [
  'TI', 'Recursos Humanos', 'PCP', 'Ambulatório', 'Segurança do Trabalho', 
  'SGI', 'Gerência de Produção', 'Faturamento', 'Contabilidade', 
  'Automação Industrial', 'Portaria', 'Compras', 'Qualidade Escritório', 
  'Cotação', 'Gerencia', 'Sala do Fernando', 'Controladoria', 'Escritório'
];

const setoresProducao = [
  'Solda', 'Usinagem', 'Dobra', 'Estoque de Componentes', 'Calandra', 
  'Serra', 'Prensa', 'Solda Robo', 'Ecoat', 'Qualidade Produção', 
  'Seis Sigma', 'Manutenção', 'Expedição (Deni)', 'Laser', 'Puncionadeira', 
  'Recebimento', 'Pintura Liquida', 'Pintura Pó', 'Logística', 
  'Portaria Catraca', 'Laboratório Químico', 'Almoxarifado', 'Balança', 
  'Expedição', 'Processos', 'Sala Limpa', 'Ferramentaria', 
  'Braço Tridimencional', 'Casa de Tintas', 'Depart. Técnico de Solda', 
  'Logística Empilhadeiras', 'Almoxarifado Transferíveis', 'Amostra', 'Jato de Granalha'
];

async function main() {
  console.log("⏳ Iniciando a sincronização em massa dos setores...");

  try {
    // 1. Injetando setores Administrativos (120 dias)
    for (const nome of setoresAdministrativos) {
      await prisma.sector.upsert({
        where: { name: nome },
        update: {}, // Se já existir, não faz nada
        create: {
          name: nome,
          type: 'ADMINISTRATIVO',
          maintenanceInterval: 120 // 🟢 O NOME CORRETO DA COLUNA AQUI
        }
      });
    }
    console.log(`✅ ${setoresAdministrativos.length} setores ADMINISTRATIVOS sincronizados!`);

    // 2. Injetando setores de Produção (30 dias)
    for (const nome of setoresProducao) {
      await prisma.sector.upsert({
        where: { name: nome },
        update: {}, 
        create: {
          name: nome,
          type: 'PRODUCAO',
          maintenanceInterval: 30 // 🟢 O NOME CORRETO DA COLUNA AQUI
        }
      });
    }
    console.log(`✅ ${setoresProducao.length} setores de PRODUÇÃO sincronizados!`);
    
    console.log("🚀 TUDO PRONTO! O banco de dados foi atualizado com sucesso.");

  } catch (error) {
    console.error('❌ Erro ao sincronizar setores no banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();