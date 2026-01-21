import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, AppConfig } from '../types'

const DEFAULT_CONFIG: AppConfig = {
  appMode: 'production',
  tomDeVoz: 'Profissional',
  duracaoMedia: '60s',
  formatoVideo: '9:16',
  estiloVisual: 'Moderno',
  modeloIA: 'gemini-pro',
  apiKeys: { openai: '', gemini: '', elevenlabs: '', youtube: '' }
}

interface Store {
  // Configurações
  configuracoes: AppConfig
  setConfiguracoes: (config: Partial<AppConfig>) => void

  // Loading state
  loading: boolean
  loadingMessage: string
  setLoading: (loading: boolean, message?: string) => void

  // Temp keys (SMART mode)
  tempKeys: Record<string, string>
  setTempKey: (service: string, key: string) => void
  getTempKey: (service: string) => string | undefined

  // Canal data
  canal: { nome: string; inscritos: number; conectado: boolean; metricas30dias: any }
  canais: any[]
  canalAtivo: string | null
  addCanal: (canal: any) => void
  removeCanal: (nome: string) => void
  setActiveCanal: (nome: string) => void

  // Toast notifications
  toasts: any[]
  addToast: (toast: any) => void
  removeToast: (id: string) => void

  // Reset
  reset: () => void
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      configuracoes: DEFAULT_CONFIG,
      loading: false,
      loadingMessage: '',
      tempKeys: {}, // Chaves de sessão (não salvas no disco por segurança padrão, mas persistidas no refresh pelo zustand)

      // Canal data - prevent undefined errors
      canal: { nome: '', inscritos: 0, conectado: false, metricas30dias: null },
      canais: [],
      canalAtivo: null,

      // Toast notifications
      toasts: [],

      setConfiguracoes: (newConfig) => set((state) => ({ configuracoes: { ...state.configuracoes, ...newConfig } })),
      setLoading: (loading, message) => set({ loading, loadingMessage: message || 'Carregando...' }),

      setTempKey: (service, key) => set((state) => ({ tempKeys: { ...state.tempKeys, [service]: key } })),
      getTempKey: (service) => get().tempKeys[service],

      // Canal management
      addCanal: (canal) => set((state) => ({
        canais: [...state.canais, canal],
        canalAtivo: canal.nome
      })),
      removeCanal: (nome) => set((state) => ({
        canais: state.canais.filter(c => c.nome !== nome),
        canalAtivo: state.canalAtivo === nome ? state.canais[0]?.nome || null : state.canalAtivo
      })),
      setActiveCanal: (nome) => set({ canalAtivo: nome }),

      // Toast notifications
      addToast: (toast) => set((state) => ({
        toasts: [...state.toasts, { ...toast, id: Date.now().toString() }]
      })),
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),

      reset: () => set({
        configuracoes: DEFAULT_CONFIG,
        tempKeys: {},
        canais: [],
        canalAtivo: null,
        toasts: []
      })
    }),
    {
      name: 'autnew-smart-storage',
      partialize: (state) => ({
          configuracoes: state.configuracoes,
          tempKeys: state.tempKeys, // Persiste chaves manuais entre reloads
          canais: state.canais,
          canalAtivo: state.canalAtivo
      })
    }
  )
)
