/**
 * Configuração central de modo da aplicação
 *
 * IMPORTANTE: O modo é determinado pelo estado no Zustand store (configuracoes.appMode)
 * Este arquivo fornece utilitários para trabalhar com os modos.
 *
 * MODOS:
 * - 'test': Dados simulados, sem custos, para desenvolvimento e testes
 * - 'production': APIs reais, custos reais, dados reais
 */

export type AppMode = 'test' | 'production'

/**
 * Verifica se uma string é um modo válido
 */
export function isValidMode(mode: string): mode is AppMode {
  return mode === 'test' || mode === 'production'
}

/**
 * Helper para criar mensagens específicas por modo
 */
export function getModeMessage(isTestMode: boolean, testMessage: string, prodMessage: string): string {
  return isTestMode ? testMessage : prodMessage
}

/**
 * Helper para estados vazios em produção
 */
export const EMPTY_STATES = {
  gatilho: {
    title: 'Configure seu vídeo',
    message: 'Preencha o tema e as configurações para começar a produção.',
  },
  inteligencia: {
    title: 'Análise de Inteligência',
    message: 'Os dados de pesquisa e análise serão exibidos aqui após o processamento.',
  },
  criacao: {
    title: 'Criação de Conteúdo',
    message: 'O roteiro e as variações serão gerados aqui.',
  },
  estudio: {
    title: 'Estúdio de Montagem',
    message: 'As cenas do seu vídeo aparecerão aqui após a aprovação do roteiro.',
  },
  entrega: {
    title: 'Entrega Final',
    message: 'O vídeo renderizado e os arquivos para download estarão disponíveis aqui.',
  },
  historico: {
    title: 'Histórico vazio',
    message: 'Você ainda não tem produções salvas. Complete um fluxo de produção para ver aqui.',
  },
  monitor: {
    title: 'Sem dados de uso',
    message: 'Os dados de consumo das APIs serão exibidos aqui conforme você utilizar o sistema.',
  },
  diretrizes: {
    title: 'Configure suas diretrizes',
    message: 'Adicione diretrizes personalizadas para guiar a criação de conteúdo.',
  },
}

/**
 * Mensagens de erro padrão
 */
export const ERROR_MESSAGES = {
  apiKeyMissing: (apiName: string) => `API Key de ${apiName} não configurada. Vá em Configurações para adicionar.`,
  apiConnectionFailed: (apiName: string) => `Falha ao conectar com ${apiName}. Verifique sua conexão e API Key.`,
  genericError: 'Ocorreu um erro. Por favor, tente novamente.',
  networkError: 'Erro de rede. Verifique sua conexão com a internet.',
  invalidResponse: 'Resposta inválida da API. Tente novamente.',
}

/**
 * Labels para UI baseado no modo
 */
export const MODE_LABELS = {
  test: {
    badge: 'TESTE',
    subtitle: 'Dados mock',
    description: 'Dados simulados para testes',
  },
  production: {
    badge: 'REAL',
    subtitle: 'APIs ativas',
    description: 'APIs reais - custos podem ocorrer',
  },
}
