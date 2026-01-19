// ============================================
// EDGE TTS - Narração Gratuita (Microsoft Neural Voices)
// Usa a API de síntese de voz do Microsoft Edge
// ============================================

import { isTestMode } from './api'
import { mockDelay, getMockAudioUrl } from './mockData'

// Available Portuguese Brazilian voices
export const EDGE_TTS_VOICES = {
  'pt-BR': {
    female: [
      { id: 'pt-BR-FranciscaNeural', name: 'Francisca', description: 'Voz feminina natural e expressiva' },
      { id: 'pt-BR-LeticiaNeural', name: 'Letícia', description: 'Voz feminina jovem' },
      { id: 'pt-BR-ManuelaNeural', name: 'Manuela', description: 'Voz feminina madura' },
    ],
    male: [
      { id: 'pt-BR-AntonioNeural', name: 'Antonio', description: 'Voz masculina natural e expressiva' },
      { id: 'pt-BR-NicolauNeural', name: 'Nicolau', description: 'Voz masculina jovem' },
      { id: 'pt-BR-ValerioNeural', name: 'Valério', description: 'Voz masculina madura' },
    ],
  },
}

export interface EdgeTTSOptions {
  voice: string
  rate?: string // e.g., '+10%', '-20%', default '0%'
  pitch?: string // e.g., '+5Hz', '-10Hz', default '0Hz'
  volume?: string // e.g., '+20%', '-10%', default '0%'
}

export interface EdgeTTSResult {
  audioUrl: string
  duration: number // estimated duration in seconds
  source: 'edge-tts'
  cost: number // always 0 for Edge TTS
  voice: string
}

// Estimate audio duration based on text length
// Average speaking rate: ~150 words per minute, ~3 characters per word
function estimateAudioDuration(text: string): number {
  const wordsPerMinute = 150
  const charsPerWord = 5
  const wordCount = text.length / charsPerWord
  const minutes = wordCount / wordsPerMinute
  return Math.ceil(minutes * 60) // return seconds
}

/**
 * Generate speech using Edge TTS (via backend API)
 * This is a FREE alternative to ElevenLabs
 *
 * @param text Text to convert to speech
 * @param options Voice and prosody options
 */
export async function generateEdgeTTS(
  text: string,
  options: EdgeTTSOptions = { voice: 'pt-BR-FranciscaNeural' }
): Promise<EdgeTTSResult> {
  const estimatedDuration = estimateAudioDuration(text)

  if (isTestMode()) {
    console.log('[TEST MODE] Simulando geração de áudio com Edge TTS')
    console.log(`[TEST MODE] Voz: ${options.voice}, Duração estimada: ${estimatedDuration}s`)
    await mockDelay(1500)
    return {
      audioUrl: getMockAudioUrl(),
      duration: estimatedDuration,
      source: 'edge-tts',
      cost: 0, // Edge TTS is FREE
      voice: options.voice,
    }
  }

  try {
    // Call our backend API that wraps edge-tts
    const response = await fetch('/api/edge-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: options.voice,
        rate: options.rate || '0%',
        pitch: options.pitch || '0Hz',
        volume: options.volume || '0%',
      }),
    })

    if (!response.ok) {
      throw new Error(`Edge TTS API error: ${response.status}`)
    }

    const data = await response.json()
    return {
      audioUrl: data.audioUrl,
      duration: data.duration || estimatedDuration,
      source: 'edge-tts',
      cost: 0, // Edge TTS is FREE
      voice: options.voice,
    }
  } catch (error) {
    console.error('Edge TTS error:', error)
    throw error
  }
}

/**
 * Get list of available voices for a language
 */
export function getAvailableVoices(language: 'pt-BR' = 'pt-BR') {
  return EDGE_TTS_VOICES[language]
}

/**
 * Get recommended voice for spiritual/prayer content
 */
export function getRecommendedVoice(gender: 'female' | 'male' = 'female'): string {
  // Francisca and Antonio are the most natural sounding voices
  return gender === 'female' ? 'pt-BR-FranciscaNeural' : 'pt-BR-AntonioNeural'
}

/**
 * Calculate cost comparison between Edge TTS and ElevenLabs
 */
export function calculateCostSavings(textLength: number): {
  edgeTtsCost: number
  elevenLabsCost: number
  savings: number
  savingsPercent: number
} {
  // ElevenLabs costs approximately $0.30 per 1000 characters (Creator plan)
  const elevenLabsCost = (textLength / 1000) * 0.30
  const edgeTtsCost = 0 // FREE

  return {
    edgeTtsCost,
    elevenLabsCost: parseFloat(elevenLabsCost.toFixed(2)),
    savings: parseFloat(elevenLabsCost.toFixed(2)),
    savingsPercent: 100,
  }
}
