import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppState,
  PipelinePhase,
  GatilhoData,
  InteligenciaData,
  CriacaoData,
  EstudioData,
  EntregaData,
  CanalData,
  Diretrizes,
  DiretrizPerfil,
  Configuracoes,
  Producao,
  APIStatusInfo,
  Toast,
} from '../types'

const initialGatilho: GatilhoData = {
  tema: '',
  tipoConteudo: 'oracao-guiada',
  duracao: '5-10min',
  gatilhosEmocionais: [],
  observacoesEspeciais: '',
  concorrentes: [],
  // Deprecated fields - keeping for compatibility
  concorrenteLink: '',
  concorrenteTranscricao: '',
  concorrenteMetadados: null,
}

const initialCriacao: CriacaoData = {
  // LEGACY fields
  opcoes: [],
  opcaoSelecionada: null,
  // NEW MODEL: Single video with variations
  roteiro: '',
  roteiroAprovado: false,
  titleVariants: [],
  thumbVariants: [],
}

const initialEstudio: EstudioData = {
  cenas: [],
  trilhaSonora: '',
  progressoRenderizacao: 0,
}

const initialCanal: CanalData = {
  nome: 'Mundo da Prece',
  inscritos: 0,
  conectado: false,
  metricas30dias: null,
}

const initialDiretrizes: Diretrizes = {
  listaNegra: [
    'blindar',
    'escudo',
    'chave',
    'amuleto',
    'simpatia',
    'magia',
    'feitiço',
    'encantamento',
    'ritual mágico',
  ],
  estiloVisual: {
    fontes: 'Bold com alto contraste',
    paletaCores: ['dourado', 'azul celestial', 'branco'],
    imagensPreferidas: 'Pessoas aparentando 60+ anos, paisagens celestiais, luz divina',
    regrasTexto: 'Texto da thumbnail deve complementar (não repetir) o título',
  },
  ctasObrigatorios: {
    abertura: 'Se inscreva no canal e ative o sininho para receber mais orações',
    meio: 'Baixe nosso E-book gratuito com 30 orações poderosas - link na descrição',
    fechamento: 'Entre no nosso Grupo VIP do WhatsApp - link na descrição',
  },
  arquiteturaRoteiro: {
    aberturaMagnetica: '15 segundos de gancho emocional forte',
    ganchoEmocional: 'Até 30 segundos, conectar com a dor/desejo do público',
    desenvolvimento: 'Pausas para respiração, tom suave e acolhedor',
    ctaMeio: 'Inserir convite do E-book naturalmente',
    fechamento: 'Mensagem de esperança e fé',
    ctaFinal: 'Inscrição + Grupo VIP WhatsApp',
  },
  // Custom diretrizes per action
  diretrizesCustomizadas: [],
}

// Default diretriz profile
const defaultDiretrizPerfil: DiretrizPerfil = {
  id: 'default',
  nome: 'Mundo da Prece - Padrão',
  descricao: 'Diretrizes padrão para o canal Mundo da Prece',
  criadoEm: new Date().toISOString(),
  conteudo: initialDiretrizes,
}

const initialConfiguracoes: Configuracoes = {
  modo: 'smart-economy', // Modo recomendado - busca recursos gratuitos primeiro
  appMode: 'test',
  apiKeys: {
    gemini: '',
    openai: '',
    elevenlabs: '',
    json2video: '',
    anthropic: '',
    groq: '',
    mistral: '',
    stabilityai: '',
    replicate: '',
    pexels: '',
    pixabay: '',
  },
  apiKeysCustom: [],
  apiKeysAtivo: {
    gemini: true,
    openai: true,
    anthropic: true,
    elevenlabs: true,
    json2video: true,
    groq: true,
    mistral: true,
    stabilityai: true,
    replicate: true,
    pexels: true,
    pixabay: true,
  },
  youtube: {
    conectado: false,
    canalNome: '',
  },
  googleDrive: {
    conectado: false,
  },
  personalizacao: {
    nomeCanal: 'Mundo da Prece',
    nicho: 'Espiritualidade',
    tomComunicacao: 'Acolhedor, suave, esperançoso',
  },
  json2video: {
    useWatermark: true,
    previewMode: true,
  },
}

const initialAPIStatus: APIStatusInfo[] = [
  { name: 'Gemini', status: 'unknown', lastCheck: '' },
  { name: 'OpenAI', status: 'unknown', lastCheck: '' },
  { name: 'ElevenLabs', status: 'unknown', lastCheck: '' },
  { name: 'JSON2Video', status: 'unknown', lastCheck: '' },
  { name: 'YouTube', status: 'unknown', lastCheck: '' },
]

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Current phase
      faseAtual: 'gatilho',
      setFaseAtual: (fase: PipelinePhase) => set({ faseAtual: fase }),

      // Pipeline data
      gatilho: initialGatilho,
      setGatilho: (data: Partial<GatilhoData>) =>
        set((state) => ({ gatilho: { ...state.gatilho, ...data } })),

      inteligencia: null,
      setInteligencia: (data: InteligenciaData) => set({ inteligencia: data }),

      criacao: initialCriacao,
      setCriacao: (data: Partial<CriacaoData>) =>
        set((state) => ({ criacao: { ...state.criacao, ...data } })),

      estudio: initialEstudio,
      setEstudio: (data: Partial<EstudioData>) =>
        set((state) => ({ estudio: { ...state.estudio, ...data } })),

      entrega: null,
      setEntrega: (data: EntregaData) => set({ entrega: data }),

      // Canal data - multiple channels support
      canal: initialCanal,
      setCanal: (data: Partial<CanalData>) =>
        set((state) => ({ canal: { ...state.canal, ...data } })),

      canais: [initialCanal],
      canalAtivo: 'Mundo da Prece',

      addCanal: (canal: CanalData) =>
        set((state) => ({
          canais: [...state.canais, canal],
          canal: canal,
          canalAtivo: canal.nome,
        })),

      removeCanal: (nome: string) =>
        set((state) => {
          const newCanais = state.canais.filter((c) => c.nome !== nome)
          const newAtivo = newCanais.length > 0 ? newCanais[0].nome : null
          return {
            canais: newCanais,
            canalAtivo: newAtivo,
            canal: newCanais.length > 0 ? newCanais[0] : initialCanal,
          }
        }),

      setActiveCanal: (nome: string) =>
        set((state) => {
          const canal = state.canais.find((c) => c.nome === nome)
          if (canal) {
            return { canalAtivo: nome, canal }
          }
          return {}
        }),

      // Guidelines - multiple profiles support
      diretrizes: initialDiretrizes,
      setDiretrizes: (data: Partial<Diretrizes>) =>
        set((state) => ({ diretrizes: { ...state.diretrizes, ...data } })),

      diretrizPerfis: [defaultDiretrizPerfil],
      diretrizAtiva: 'default',

      addDiretrizPerfil: (perfil: DiretrizPerfil) =>
        set((state) => ({
          diretrizPerfis: [...state.diretrizPerfis, perfil],
          diretrizAtiva: perfil.id,
          diretrizes: perfil.conteudo,
        })),

      removeDiretrizPerfil: (id: string) =>
        set((state) => {
          if (id === 'default') return {} // Can't delete default
          const newPerfis = state.diretrizPerfis.filter((p) => p.id !== id)
          const newAtiva = state.diretrizAtiva === id ? 'default' : state.diretrizAtiva
          const activePerfil = newPerfis.find((p) => p.id === newAtiva)
          return {
            diretrizPerfis: newPerfis,
            diretrizAtiva: newAtiva,
            diretrizes: activePerfil?.conteudo || initialDiretrizes,
          }
        }),

      setActiveDiretriz: (id: string) =>
        set((state) => {
          const perfil = state.diretrizPerfis.find((p) => p.id === id)
          if (perfil) {
            return { diretrizAtiva: id, diretrizes: perfil.conteudo }
          }
          return {}
        }),

      updateDiretrizPerfil: (id: string, data: Partial<DiretrizPerfil>) =>
        set((state) => ({
          diretrizPerfis: state.diretrizPerfis.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
          // If updating active profile's content, also update diretrizes
          ...(state.diretrizAtiva === id && data.conteudo
            ? { diretrizes: { ...state.diretrizes, ...data.conteudo } }
            : {}),
        })),

      // Settings
      configuracoes: initialConfiguracoes,
      setConfiguracoes: (data: Partial<Configuracoes>) =>
        set((state) => ({ configuracoes: { ...state.configuracoes, ...data } })),

      // History
      historico: [],
      addProducao: (producao: Producao) =>
        set((state) => ({ historico: [producao, ...state.historico] })),
      removeProducao: (id: string) =>
        set((state) => ({
          historico: state.historico.filter((p) => p.id !== id),
        })),
      toggleFavorito: (id: string) =>
        set((state) => ({
          historico: state.historico.map((p) =>
            p.id === id ? { ...p, favorito: !p.favorito } : p
          ),
        })),

      // API Status
      apiStatus: initialAPIStatus,
      setAPIStatus: (status: APIStatusInfo[]) => set({ apiStatus: status }),

      // UI State
      loading: false,
      setLoading: (loading: boolean) => set({ loading }),
      loadingMessage: '',
      setLoadingMessage: (message: string) => set({ loadingMessage: message }),

      // Toast notifications
      toasts: [],
      addToast: (toast: Omit<Toast, 'id'>) => {
        const id = Date.now().toString()
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
        // Auto remove after duration
        setTimeout(() => {
          get().removeToast(id)
        }, toast.duration || 4000)
      },
      removeToast: (id: string) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // Reset pipeline
      resetPipeline: () =>
        set({
          faseAtual: 'gatilho',
          gatilho: initialGatilho,
          inteligencia: null,
          criacao: initialCriacao,
          estudio: initialEstudio,
          entrega: null,
        }),
    }),
    {
      name: 'autnew-storage',
      partialize: (state) => ({
        historico: state.historico,
        diretrizes: state.diretrizes,
        diretrizPerfis: state.diretrizPerfis,
        diretrizAtiva: state.diretrizAtiva,
        configuracoes: state.configuracoes,
        canal: state.canal,
        canais: state.canais,
        canalAtivo: state.canalAtivo,
      }),
    }
  )
)
