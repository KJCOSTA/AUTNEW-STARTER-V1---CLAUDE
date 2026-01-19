// ============================================
// AUTNEW STARTER V1 - TYPE DEFINITIONS
// ============================================

// Pipeline Phases
export type PipelinePhase = 'gatilho' | 'inteligencia' | 'criacao' | 'estudio' | 'entrega'

export interface PhaseInfo {
  id: PipelinePhase
  name: string
  description: string
  icon: string
}

// Content Types
export type ContentType =
  | 'oracao-guiada'
  | 'meditacao-espiritual'
  | 'reflexao-biblica'
  | 'salmo-narrado'
  | 'mensagem-fe'

export type DurationType = '3-5min' | '5-10min' | '10-15min' | '15+min'

export type EmotionalTrigger =
  | 'esperanca'
  | 'cura'
  | 'protecao'
  | 'gratidao'
  | 'paz-interior'
  | 'forca'
  | 'perdao'
  | 'prosperidade'
  | 'sabedoria'

// Phase 1: Gatilho (Trigger) Input Data
export interface GatilhoData {
  tema: string
  tipoConteudo: ContentType
  duracao: DurationType
  gatilhosEmocionais: EmotionalTrigger[]
  observacoesEspeciais: string
  concorrenteLink: string
  concorrenteTranscricao: string
  concorrenteMetadados: YouTubeMetadata | null
}

// YouTube Metadata from competitor
export interface YouTubeMetadata {
  videoId: string
  titulo: string
  canal: string
  inscritos: string
  views: number
  likes: number
  comentarios: number
  dataPublicacao: string
  diasDecorridos: number
  duracao: string
  tags: string[]
  descricao: string
  thumbnailUrl: string
}

// User's channel data
export interface CanalData {
  nome: string
  inscritos: number
  conectado: boolean
  metricas30dias: {
    melhorVideo: string
    retencaoMedia: number
    duracaoPerforma: string
    totalViews: number
  } | null
}

// Phase 2: Intelligence Analysis Results
export interface InteligenciaData {
  deepResearch: {
    fatos: string[]
    curiosidades: string[]
    referencias: string[]
  }
  analiseCanal: {
    padroesSuccesso: string[]
    temasRetencao: string[]
    duracaoIdeal: string
    gatilhosEngajamento: string[]
  }
  analiseConcorrente: {
    estruturaNarrativa: string
    ganchosRetencao: string[]
    elementosVirais: string[]
  }
}

// Phase 3: Creation Options
export interface OpcaoCriacao {
  id: number
  titulo: string
  conceitoThumbnail: string
  goldenHook: string
  thumbnailUrl?: string
  thumbnailPrompt?: string
}

export interface CriacaoData {
  opcoes: OpcaoCriacao[]
  opcaoSelecionada: number | null
  roteiro: string
  roteiroAprovado: boolean
}

// Phase 4: Studio - Scenes
export interface Cena {
  id: number
  timestamp: string
  texto: string
  visualSugerido: string
  visualUrl?: string
  visualTipo: 'stock' | 'gerado' | 'upload'
  audioUrl?: string
  audioDuracao?: number
}

export interface EstudioData {
  cenas: Cena[]
  trilhaSonora: string
  videoRenderizado?: string
  progressoRenderizacao: number
}

// Phase 5: Delivery Package
export interface EntregaData {
  videoUrl?: string
  thumbnailUrl: string
  titulo: string
  descricaoSEO: string
  tags: string[]
  roteiro: string
  promptThumbnail: string
  publicadoYouTube: boolean
  agendamento?: string
}

// Production History
export interface Producao {
  id: string
  dataCriacao: string
  tema: string
  tipoConteudo: ContentType
  duracao: DurationType
  titulo: string
  thumbnailUrl?: string
  favorito: boolean
  gatilho: GatilhoData
  inteligencia?: InteligenciaData
  criacao?: CriacaoData
  estudio?: EstudioData
  entrega?: EntregaData
}

// Guidelines Module
export interface Diretrizes {
  listaNegra: string[]
  estiloVisual: {
    fontes: string
    paletaCores: string[]
    imagensPreferidas: string
    regrasTexto: string
  }
  ctasObrigatorios: {
    abertura: string
    meio: string
    fechamento: string
  }
  arquiteturaRoteiro: {
    aberturaMagnetica: string
    ganchoEmocional: string
    desenvolvimento: string
    ctaMeio: string
    fechamento: string
    ctaFinal: string
  }
}

// API Status
export type APIStatus = 'online' | 'warning' | 'offline' | 'unknown'

export interface APIStatusInfo {
  name: string
  status: APIStatus
  lastCheck: string
  message?: string
}

// Settings
export type OperationMode = 'mvp' | 'producao'

// Test Mode
export type AppMode = 'test' | 'production'

export interface Configuracoes {
  modo: OperationMode
  appMode: AppMode
  apiKeys: {
    gemini: string
    openai: string
    elevenlabs: string
    json2video: string
  }
  youtube: {
    conectado: boolean
    canalNome: string
    accessToken?: string
    refreshToken?: string
  }
  personalizacao: {
    nomeCanal: string
    nicho: string
    tomComunicacao: string
  }
}

// Global App State
export interface AppState {
  // Current phase
  faseAtual: PipelinePhase
  setFaseAtual: (fase: PipelinePhase) => void

  // Pipeline data
  gatilho: GatilhoData
  setGatilho: (data: Partial<GatilhoData>) => void

  inteligencia: InteligenciaData | null
  setInteligencia: (data: InteligenciaData) => void

  criacao: CriacaoData
  setCriacao: (data: Partial<CriacaoData>) => void

  estudio: EstudioData
  setEstudio: (data: Partial<EstudioData>) => void

  entrega: EntregaData | null
  setEntrega: (data: EntregaData) => void

  // Canal data
  canal: CanalData
  setCanal: (data: Partial<CanalData>) => void

  // Guidelines
  diretrizes: Diretrizes
  setDiretrizes: (data: Partial<Diretrizes>) => void

  // Settings
  configuracoes: Configuracoes
  setConfiguracoes: (data: Partial<Configuracoes>) => void

  // History
  historico: Producao[]
  addProducao: (producao: Producao) => void
  removeProducao: (id: string) => void
  toggleFavorito: (id: string) => void

  // API Status
  apiStatus: APIStatusInfo[]
  setAPIStatus: (status: APIStatusInfo[]) => void

  // UI State
  loading: boolean
  setLoading: (loading: boolean) => void
  loadingMessage: string
  setLoadingMessage: (message: string) => void

  // Toast notifications
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  // Reset
  resetPipeline: () => void
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

// Navigation
export type ModuleName = 'plan-run' | 'diretrizes' | 'monitor' | 'historico' | 'configuracoes'

export interface MenuItem {
  id: ModuleName
  label: string
  icon: string
}
