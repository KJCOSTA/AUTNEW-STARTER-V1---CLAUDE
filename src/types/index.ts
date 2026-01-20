// ============================================
// AUTNEW STARTER V1 - TYPE DEFINITIONS
// ============================================

// Pipeline Phases
export type PipelinePhase = 'gatilho' | 'planejamento' | 'inteligencia' | 'criacao' | 'estudio' | 'entrega'

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
export interface ConcorrenteData {
  id: string
  link: string
  transcricao: string
  metadados: YouTubeMetadata | null
}

export interface GatilhoData {
  tema: string
  tipoConteudo: ContentType
  duracao: DurationType
  gatilhosEmocionais: EmotionalTrigger[]
  observacoesEspeciais: string
  concorrentes: ConcorrenteData[]
  // Deprecated - keeping for backwards compatibility
  concorrenteLink: string
  concorrenteTranscricao: string
  concorrenteMetadados: YouTubeMetadata | null
}

// YouTube Metadata from competitor - Extended
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
  // Extended data from YouTube API
  canalId?: string
  canalDescricao?: string
  canalDataCriacao?: string
  canalPais?: string
  canalTotalVideos?: number
  canalTotalViews?: number
  canalPlaylistUploads?: string
  categoria?: string
  idioma?: string
  legendasDisponiveis?: string[]
  licensaCreativeCommons?: boolean
  embedHabilitado?: boolean
  estatisticasAvancadas?: {
    taxaEngajamento?: number
    retencaoEstimada?: number
    ctrEstimado?: number
    crescimentoInscritos30d?: number
    frequenciaUpload?: string
  }
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

// Phase 1.5: Planejamento - Human-in-the-Loop checkpoint
export interface PlanejamentoData {
  // Plano de pesquisa gerado automaticamente (editável)
  planoPesquisa: string
  // Se o plano foi aprovado pelo usuário
  aprovado: boolean
  // Timestamp da aprovação
  aprovadoEm?: string
  // Versão original do plano (para comparação)
  planoOriginal?: string
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
// LEGACY - kept for backwards compatibility
export interface OpcaoCriacao {
  id: number
  titulo: string
  conceitoThumbnail: string
  goldenHook: string
  thumbnailUrl?: string
  thumbnailPrompt?: string
}

// NEW MODEL: 1 video with variations for A/B testing
// Title variant for the same video
export interface TitleVariant {
  id: number
  titulo: string
  goldenHook: string
  descricao: string // Description/concept for this title approach
}

// Thumbnail variant for the same video
export interface ThumbVariant {
  id: number
  conceito: string // Visual concept description
  prompt: string // Image generation prompt
  imageUrl?: string // Generated/uploaded image URL
}

export interface CriacaoData {
  // LEGACY fields - kept for backwards compatibility
  opcoes: OpcaoCriacao[]
  opcaoSelecionada: number | null

  // NEW MODEL: Single video with variations
  roteiro: string // Single script for the video
  roteiroAprovado: boolean

  // 3 title variations for A/B testing
  titleVariants: TitleVariant[]

  // 3 thumbnail variations for A/B testing
  thumbVariants: ThumbVariant[]
}

// Phase 4: Studio - Scenes

// Video/Image search result for selection
export interface MediaOption {
  id: string
  url: string
  thumbnailUrl: string
  source: 'pexels' | 'pixabay' | 'unsplash' | 'dalle' | 'upload'
  type: 'video' | 'image'
  duration?: number // For videos, in seconds
  attribution?: string
  width?: number
  height?: number
}

export interface Cena {
  id: number
  timestamp: string
  texto: string
  visualSugerido: string
  searchQuery?: string // Editable search query for this scene
  visualUrl?: string
  visualTipo: 'stock' | 'gerado' | 'upload'
  audioUrl?: string
  audioDuracao?: number
  // New: Selected media and available options
  selectedMedia?: MediaOption
  mediaOptions?: MediaOption[] // Search results for user to choose from
  mediaSearchStatus?: 'idle' | 'searching' | 'found' | 'not-found'
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

  // NEW MODEL: Preserve all 3 variations for A/B testing
  titleVariants: TitleVariant[] // 3 title options
  thumbVariants: ThumbVariant[] // 3 thumbnail options

  // LEGACY - kept for backwards compatibility (first variant or selected)
  thumbnailUrl: string
  titulo: string
  promptThumbnail: string

  descricaoSEO: string
  tags: string[]
  roteiro: string
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

// Action types for custom diretrizes
export type DiretrizAcaoTipo =
  | 'roteiro'
  | 'thumbnail'
  | 'audio'
  | 'video'
  | 'narracao'
  | 'descricao'
  | 'todas'

// Custom diretriz that can be applied to specific actions
export interface DiretrizCustomizada {
  id: string
  titulo: string
  descricao: string
  conteudo: string
  acoes: DiretrizAcaoTipo[]
  ativa: boolean
  criadaEm: string
}

export interface DiretrizesContent {
  // Seções ativas (toggle on/off)
  secoesAtivas?: {
    listaNegra: boolean
    estiloVisual: boolean
    ctasObrigatorios: boolean
    arquiteturaRoteiro: boolean
  }
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
  // Custom diretrizes per action
  diretrizesCustomizadas: DiretrizCustomizada[]
}

export interface DiretrizPerfil {
  id: string
  nome: string
  descricao: string
  criadoEm: string
  conteudo: DiretrizesContent
}

// Backward compatibility alias
export type Diretrizes = DiretrizesContent

// API Status
export type APIStatus = 'online' | 'warning' | 'offline' | 'unknown'

export interface APIStatusInfo {
  name: string
  status: APIStatus
  lastCheck: string
  message?: string
}

// Settings
export type OperationMode = 'mvp' | 'producao' | 'full-ai' | 'smart-economy' | 'custom'

// Custom Mode Step Options
export type RoteiroOption = 'gemini' | 'gpt4' | 'claude' | 'manual'
export type TituloSeoOption = 'gemini' | 'gpt4' | 'claude'
export type ThumbnailOption = 'dalle-standard' | 'dalle-hd' | 'manual' | 'unsplash' | 'pexels'
export type NarracaoOption = 'elevenlabs-multilingual' | 'elevenlabs-turbo' | 'edge-tts' | 'manual' | 'capcut-tts'
export type VideoOption = 'json2video' | 'capcut' | 'remotion'
export type UploadOption = 'youtube-api' | 'manual'
export type MediaSourceOption = 'pexels' | 'pixabay' | 'unsplash' | 'dalle' | 'runway' | 'manual'

export interface CustomModeConfig {
  nome: string
  roteiro: RoteiroOption
  tituloSeo: TituloSeoOption
  thumbnail: ThumbnailOption
  narracao: NarracaoOption
  video: VideoOption
  upload: UploadOption
}

// Test Mode
export type AppMode = 'test' | 'production'

// API Key configuration
export interface APIKeyConfig {
  key: string
  nome: string
  tipo: 'api-key' | 'oauth'
  valida?: boolean
  ultimoTeste?: string
  ativo?: boolean  // Whether this key is active/enabled
}

export interface Configuracoes {
  modo: OperationMode
  appMode: AppMode
  apiKeys: {
    gemini: string
    openai: string
    elevenlabs: string
    json2video: string
    // Additional API providers
    anthropic?: string
    groq?: string
    mistral?: string
    stabilityai?: string
    replicate?: string
    pexels?: string
    pixabay?: string
  }
  // Custom API keys that user can add
  apiKeysCustom: APIKeyConfig[]
  // Track active/inactive state for built-in API keys
  apiKeysAtivo: Record<string, boolean>
  youtube: {
    conectado: boolean
    canalNome: string
    accessToken?: string
    refreshToken?: string
  }
  // Google Drive for data import
  googleDrive?: {
    conectado: boolean
    accessToken?: string
    refreshToken?: string
  }
  personalizacao: {
    nomeCanal: string
    nicho: string
    tomComunicacao: string
  }
  // JSON2Video settings
  json2video: {
    useWatermark: boolean
    previewMode: boolean
  }
  // Custom mode configuration
  customMode?: CustomModeConfig
}

// Global App State
export interface AppState {
  // Current phase
  faseAtual: PipelinePhase
  setFaseAtual: (fase: PipelinePhase) => void

  // Pipeline data
  gatilho: GatilhoData
  setGatilho: (data: Partial<GatilhoData>) => void

  planejamento: PlanejamentoData
  setPlanejamento: (data: Partial<PlanejamentoData>) => void

  inteligencia: InteligenciaData | null
  setInteligencia: (data: InteligenciaData) => void

  criacao: CriacaoData
  setCriacao: (data: Partial<CriacaoData>) => void

  estudio: EstudioData
  setEstudio: (data: Partial<EstudioData>) => void

  entrega: EntregaData | null
  setEntrega: (data: EntregaData) => void

  // Canal data - multiple channels support
  canal: CanalData
  setCanal: (data: Partial<CanalData>) => void
  canais: CanalData[]
  canalAtivo: string | null
  addCanal: (canal: CanalData) => void
  removeCanal: (nome: string) => void
  setActiveCanal: (nome: string) => void

  // Guidelines - multiple profiles support
  diretrizes: Diretrizes
  setDiretrizes: (data: Partial<Diretrizes>) => void
  diretrizPerfis: DiretrizPerfil[]
  diretrizAtiva: string | null
  addDiretrizPerfil: (perfil: DiretrizPerfil) => void
  removeDiretrizPerfil: (id: string) => void
  setActiveDiretriz: (id: string) => void
  updateDiretrizPerfil: (id: string, data: Partial<DiretrizPerfil>) => void

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
