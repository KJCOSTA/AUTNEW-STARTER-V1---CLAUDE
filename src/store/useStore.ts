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

interface Store extends AppState {
  setConfiguracoes: (config: Partial<AppConfig>) => void
  setLoading: (loading: boolean, message?: string) => void
  // Novas ações SMART
  setTempKey: (service: string, key: string) => void
  getTempKey: (service: string) => string | undefined
  tempKeys: Record<string, string>
  reset: () => void
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      configuracoes: DEFAULT_CONFIG,
      loading: false,
      loadingMessage: '',
      tempKeys: {}, // Chaves de sessão (não salvas no disco por segurança padrão, mas persistidas no refresh pelo zustand)

      setConfiguracoes: (newConfig) => set((state) => ({ configuracoes: { ...state.configuracoes, ...newConfig } })),
      setLoading: (loading, message) => set({ loading, loadingMessage: message || 'Carregando...' }),
      
      setTempKey: (service, key) => set((state) => ({ tempKeys: { ...state.tempKeys, [service]: key } })),
      getTempKey: (service) => get().tempKeys[service],
      
      reset: () => set({ configuracoes: DEFAULT_CONFIG, tempKeys: {} })
    }),
    { 
      name: 'autnew-smart-storage',
      partialize: (state) => ({ 
          configuracoes: state.configuracoes,
          tempKeys: state.tempKeys // Persiste chaves manuais entre reloads
      }) 
    }
  )
)
