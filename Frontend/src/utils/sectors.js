// src/utils/sectors.js

export const setoresAdministrativos = [
  { value: 'TI', label: 'TI' },
  { value: 'Recursos Humanos', label: 'Recursos Humanos' },
  { value: 'PCP', label: 'PCP' },
  { value: 'Ambulatório', label: 'Ambulatório' },
  { value: 'Segurança do Trabalho', label: 'Segurança do Trabalho' },
  { value: 'SGI', label: 'SGI' },
  { value: 'Gerência de Produção', label: 'Gerência de Produção' },
  { value: 'Faturamento', label: 'Faturamento' },
  { value: 'Contabilidade', label: 'Contabilidade' },
  { value: 'Automação Industrial', label: 'Automação Industrial' },
  { value: 'Portaria', label: 'Portaria' },
  { value: 'Compras', label: 'Compras' },
  { value: 'Qualidade Escritório', label: 'Qualidade Escritório' },
  { value: 'Cotação', label: 'Cotação' },
  { value: 'Gerencia', label: 'Gerencia' },
  { value: 'Sala do Fernando', label: 'Sala do Fernando' },
  { value: 'Controladoria', label: 'Controladoria' },
  { value: 'Escritório', label: 'Escritório (Padrão)' },
];

export const setoresProducao = [
  { value: 'Solda', label: 'Solda' },
  { value: 'Usinagem', label: 'Usinagem' },
  { value: 'Dobra', label: 'Dobra' },
  { value: 'Estoque de Componentes', label: 'Estoque de Componentes' },
  { value: 'Calandra', label: 'Calandra' },
  { value: 'Serra', label: 'Serra' },
  { value: 'Prensa', label: 'Prensa' },
  { value: 'Solda Robo', label: 'Solda Robo' },
  { value: 'Ecoat', label: 'Ecoat' },
  { value: 'Qualidade Produção', label: 'Qualidade Produção' },
  { value: 'Seis Sigma', label: 'Seis Sigma' },
  { value: 'Manutenção', label: 'Manutenção' },
  { value: 'Expedição (Deni)', label: 'Expedição (Deni)' },
  { value: 'Laser', label: 'Laser' },
  { value: 'Puncionadeira', label: 'Puncionadeira' },
  { value: 'Recebimento', label: 'Recebimento' },
  { value: 'Pintura Liquida', label: 'Pintura Liquida' },
  { value: 'Pintura Pó', label: 'Pintura Pó' },
  { value: 'Logística', label: 'Logística' },
  { value: 'Portaria Catraca', label: 'Portaria Catraca' },
  { value: 'Laboratório Químico', label: 'Laboratório Químico' },
  { value: 'Almoxarifado', label: 'Almoxarifado' },
  { value: 'Balança', label: 'Balança' },
  { value: 'Expedição', label: 'Expedição' },
  { value: 'Processos', label: 'Processos' },
  { value: 'Sala Limpa', label: 'Sala Limpa' },
  { value: 'Ferramentaria', label: 'Ferramentaria' },
  { value: 'Braço Tridimencional', label: 'Braço Tridimencional' },
  { value: 'Casa de Tintas', label: 'Casa de Tintas' },
  { value: 'Depart. Técnico de Solda', label: 'Depart. Técnico de Solda' },
  { value: 'Logística Empilhadeiras', label: 'Logística Empilhadeiras' },
  { value: 'Almoxarifado Transferíveis', label: 'Almoxarifado Transferíveis' },
  { value: 'Amostra', label: 'Amostra' },
  { value: 'Jato de Granalha', label: 'Jato de Granalha' },
];

export const allSetorOptions = [
  { group: 'Administrativo (120 dias)', items: setoresAdministrativos },
  { group: 'Produção (30 dias)', items: setoresProducao },
];

export function getIntervalFromSetor(setor) {
  const isProducao = setoresProducao.some(s => s.value === setor);
  return isProducao ? 30 : 120;
}