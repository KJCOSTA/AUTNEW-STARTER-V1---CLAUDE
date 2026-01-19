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
  concorrenteLink: '',
  concorrenteTranscricao: '',
  concorrenteMetadados: null,
}

const initialCriacao: CriacaoData = {
  opcoes: [],
  opcaoSelecionada: null,
  roteiro: '',
  roteiroAprovado: false,
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
}

const initialConfiguracoes: Configuracoes = {
  modo: 'mvp',
  apiKeys: {
    gemini: '',
    openai: '',
    elevenlabs: '',
    json2video: '',
  },
  youtube: {
    conectado: false,
    canalNome: '',
  },
  personalizacao: {
    nomeCanal: 'Mundo da Prece',
    nicho: 'Espiritualidade',
    tomComunicacao: 'Acolhedor, suave, esperançoso',
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

      // Canal data
      canal: initialCanal,
      setCanal: (data: Partial<CanalData>) =>
        set((state) => ({ canal: { ...state.canal, ...data } })),

      // Guidelines
      diretrizes: initialDiretrizes,
      setDiretrizes: (data: Partial<Diretrizes>) =>
        set((state) => ({ diretrizes: { ...state.diretrizes, ...data } })),

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
        configuracoes: state.configuracoes,
        canal: state.canal,
      }),
    }
  )
)
