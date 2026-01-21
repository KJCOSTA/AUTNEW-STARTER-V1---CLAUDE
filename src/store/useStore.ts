import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, AppConfig } from '../types'

/* CONFIGURAÇÃO FORÇADA PARA PRODUÇÃO 
  Este arquivo define o estado inicial da aplicação.
*/

interface Store extends AppState {
  setConfiguracoes: (config: Partial<AppConfig>) => void
  setLoading: (loading: boolean, message?: string) => void
  reset: () => void
}

const DEFAULT_CONFIG: AppConfig = {
  // FORÇADO: production para usar APIs reais
  appMode: 'production', 
  
  // Configurações padrão
  tomDeVoz: 'Profissional',
  duracaoMedia: '60s',
  formatoVideo: '9:16',
  estiloVisual: 'Moderno',
  modeloIA: 'gemini-pro',
  
  // Chaves de API (carregadas do env se possível, mas gerenciadas pelo backend)
  apiKeys: {
    openai: '',
    gemini: '',
    elevenlabs: '',
    youtube: ''
  }
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      configuracoes: DEFAULT_CONFIG,
      loading: false,
      loadingMessage: '',
      
      setConfiguracoes: (newConfig) => 
        set((state) => ({ 
          configuracoes: { ...state.configuracoes, ...newConfig } 
        })),
        
      setLoading: (loading, message) => 
        set({ loading, loadingMessage: message || 'Carregando...' }),
        
      reset: () => set({ configuracoes: DEFAULT_CONFIG })
    }),
    {
      name: 'autnew-storage',
      partialize: (state) => ({ configuracoes: state.configuracoes })
    }
  )
)
