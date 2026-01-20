// ============================================
// AUTNEW STARTER V1 - API SERVICE
// Intercepta chamadas e retorna mocks em Test Mode
// ============================================

import { useStore } from '../store/useStore'
import {
  mockDelay,
  getMockYouTubeMetadata,
  getMockInteligencia,
  getMockOpcoesCriacao,
  getMockRoteiro,
  getMockCenas,
  getMockEntrega,
  getMockThumbnail,
  getMockAudioUrl,
  getMockVideoUrl,
  getMockAPIStatus,
} from './mockData'
import type {
  YouTubeMetadata,
  InteligenciaData,
  OpcaoCriacao,
  Cena,
  EntregaData,
  GatilhoData,
} from '../types'

// Helper to check if we're in test mode
export function isTestMode(): boolean {
  const state = useStore.getState()
  return state.configuracoes.appMode === 'test'
}

// ============================================
// YOUTUBE API
// ============================================
export async function fetchYouTubeMetadata(url: string): Promise<YouTubeMetadata> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando busca de metadados do YouTube')
    await mockDelay(1200)
    return getMockYouTubeMetadata(url)
  }

  // Real API call
  const response = await fetch('/api/youtube/metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    throw new Error('Erro ao buscar metadados do YouTube')
  }

  return response.json()
}

// ============================================
// GEMINI API - Intelligence Analysis
// ============================================
export async function analyzeWithGemini(gatilho: GatilhoData): Promise<InteligenciaData> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando análise de inteligência com Gemini')
    await mockDelay(2500)
    return getMockInteligencia(
      gatilho.tema,
      gatilho.gatilhosEmocionais,
      gatilho.duracao
    )
  }

  // Real API call
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'gemini',
      action: 'analyze',
      data: gatilho,
    }),
  })

  if (!response.ok) {
    throw new Error('Erro na análise de inteligência')
  }

  return response.json()
}

// ============================================
// GEMINI API - Generate Options
// ============================================
export async function generateOptions(
  gatilho: GatilhoData,
  inteligencia: InteligenciaData
): Promise<OpcaoCriacao[]> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando geração de opções criativas')
    await mockDelay(2000)
    return getMockOpcoesCriacao(gatilho.tema, gatilho.gatilhosEmocionais)
  }

  // Real API call
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'gemini',
      action: 'generate-options',
      data: { gatilho, inteligencia },
    }),
  })

  if (!response.ok) {
    throw new Error('Erro ao gerar opções criativas')
  }

  return response.json()
}

// ============================================
// GEMINI API - Generate Script
// ============================================
export async function generateScript(
  opcao: OpcaoCriacao,
  gatilho: GatilhoData,
  inteligencia: InteligenciaData
): Promise<string> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando geração de roteiro')
    await mockDelay(3000)
    return getMockRoteiro(
      gatilho.tema,
      opcao.titulo,
      gatilho.gatilhosEmocionais,
      gatilho.duracao
    )
  }

  // Real API call
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'gemini',
      action: 'generate-script',
      data: { opcao, gatilho, inteligencia },
    }),
  })

  if (!response.ok) {
    throw new Error('Erro ao gerar roteiro')
  }

  const data = await response.json()
  return data.roteiro
}

// ============================================
// OPENAI API - Generate Thumbnail
// ============================================
export async function generateThumbnail(prompt: string): Promise<string> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando geração de thumbnail com DALL-E')
    await mockDelay(2000)
    return getMockThumbnail()
  }

  // Real API call
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'openai',
      action: 'generate-thumbnail',
      prompt,
    }),
  })

  if (!response.ok) {
    throw new Error('Erro ao gerar thumbnail')
  }

  const data = await response.json()
  return data.imageUrl
}

// ============================================
// GEMINI API - Parse Script to Scenes
// ============================================
export async function parseScriptToScenes(roteiro: string): Promise<Cena[]> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando parsing de roteiro para cenas')
    await mockDelay(1500)
    return getMockCenas(roteiro)
  }

  // Real API call
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'gemini',
      action: 'parse-scenes',
      data: { roteiro },
    }),
  })

  if (!response.ok) {
    throw new Error('Erro ao processar cenas')
  }

  return response.json()
}

// ============================================
// ELEVENLABS API - Generate Narration
// ============================================
export async function generateNarration(texto: string): Promise<string> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando geração de narração com ElevenLabs')
    await mockDelay(2000)
    return getMockAudioUrl()
  }

  // Real API call
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'elevenlabs', text: texto }),
  })

  if (!response.ok) {
    throw new Error('Erro ao gerar narração')
  }

  const data = await response.json()
  return data.audioUrl
}

// ============================================
// JSON2VIDEO API - Render Video
// ============================================
export async function renderVideo(
  cenas: Cena[],
  trilhaSonora: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando renderização de vídeo')

    // Simulate progress updates
    for (let i = 0; i <= 100; i += 10) {
      await mockDelay(300)
      onProgress?.(i)
    }

    return getMockVideoUrl()
  }

  // Real API call
  const response = await fetch('/api/json2video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cenas, trilhaSonora }),
  })

  if (!response.ok) {
    throw new Error('Erro ao renderizar vídeo')
  }

  const data = await response.json()
  return data.videoUrl
}

// ============================================
// GENERATE DELIVERY PACKAGE
// ============================================
export async function generateDeliveryPackage(
  titulo: string,
  tema: string,
  thumbnailUrl: string,
  roteiro: string
): Promise<EntregaData> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando geração de pacote de entrega')
    await mockDelay(1000)
    return getMockEntrega(titulo, tema, thumbnailUrl, roteiro)
  }

  // Real API call
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'gemini',
      action: 'generate-seo',
      data: { titulo, tema, roteiro },
    }),
  })

  if (!response.ok) {
    throw new Error('Erro ao gerar pacote de entrega')
  }

  const seoData = await response.json()
  return {
    ...seoData,
    thumbnailUrl,
    roteiro,
    publicadoYouTube: false,
  }
}

// ============================================
// YOUTUBE API - Upload Video
// ============================================
export async function uploadToYouTube(entrega: EntregaData): Promise<{ videoId: string; url: string }> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando upload para YouTube')
    await mockDelay(3000)
    return {
      videoId: 'mock_video_id_' + Date.now(),
      url: 'https://youtube.com/watch?v=mock_video_id',
    }
  }

  // Real API call
  const response = await fetch('/api/youtube/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entrega),
  })

  if (!response.ok) {
    throw new Error('Erro ao fazer upload para YouTube')
  }

  return response.json()
}

// ============================================
// CHECK API STATUS
// ============================================
export async function checkAPIStatus() {
  if (isTestMode()) {
    console.log('[TEST MODE] Retornando status simulado das APIs')
    await mockDelay(500)
    return getMockAPIStatus()
  }

  // Real API calls to check status
  const apis = ['gemini', 'openai', 'elevenlabs', 'json2video', 'youtube']
  const results = await Promise.all(
    apis.map(async (api) => {
      try {
        const response = await fetch(`/api/${api}/status`, {
          method: 'GET',
        })
        return {
          name: api.charAt(0).toUpperCase() + api.slice(1),
          status: response.ok ? 'online' : 'offline',
          lastCheck: new Date().toISOString(),
        }
      } catch {
        return {
          name: api.charAt(0).toUpperCase() + api.slice(1),
          status: 'offline',
          lastCheck: new Date().toISOString(),
        }
      }
    })
  )

  return results
}
