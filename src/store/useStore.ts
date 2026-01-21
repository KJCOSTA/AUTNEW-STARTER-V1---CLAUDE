import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, AppConfig } from '../types'

const DEFAULT_CONFIG: AppConfig = {
  appMode: 'production', // FORÇADO
  tomDeVoz: 'Profissional',
  duracaoMedia: '60s',
  formatoVideo: '9:16',
  estiloVisual: 'Moderno',
  modeloIA: 'gemini-pro',
  apiKeys: { openai: '', gemini: '', elevenlabs: '', youtube: '' }
}

interface Store extends AppState {
  setConfiguracoes: (config: Partial<AppConfig>) => void
  setLoading: (loading: boolean, message?: string) => void
  reset: () => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      configuracoes: DEFAULT_CONFIG,
      loading: false,
      loadingMessage: '',
      setConfiguracoes: (newConfig) => set((state) => ({ configuracoes: { ...state.configuracoes, ...newConfig } })),
      setLoading: (loading, message) => set({ loading, loadingMessage: message || 'Carregando...' }),
      reset: () => set({ configuracoes: DEFAULT_CONFIG })
    }),
    { name: 'autnew-storage', partialize: (state) => ({ configuracoes: state.configuracoes }) }
  )
)
