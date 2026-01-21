import { validateEnv } from "./_validateEnv"; validateEnv(["GOOGLE_TTS_KEY"]);
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Edge TTS voices for Brazilian Portuguese
const EDGE_VOICES = {
  'francisca': 'pt-BR-FranciscaNeural',
  'antonio': 'pt-BR-AntonioNeural',
  'default': 'pt-BR-FranciscaNeural',
}

// ElevenLabs Voice IDs for Portuguese Brazilian voices
const ELEVENLABS_VOICES = {
  'portuguese-female': '21m00Tcm4TlvDq8ikWAM',
  'portuguese-male': 'ErXwobaYiN019PkySvjV',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { provider = 'edge', action, ...data } = req.body

  try {
    switch (provider) {
      case 'edge':
      case 'azure':
        return handleEdgeTTS(req, res, action, data)
      case 'elevenlabs':
        return handleElevenLabs(req, res, action, data)
      default:
        return res.status(400).json({ error: `Unknown TTS provider: ${provider}` })
    }
  } catch (error) {
    console.error(`${provider} TTS error:`, error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// ============== EDGE TTS (Azure) ==============
async function handleEdgeTTS(_req: VercelRequest, res: VercelResponse, action: string, data: any) {
  const { text, voice = 'francisca', rate = '-5%', pitch = '+0Hz' } = data

  if (action === 'test' || action === 'test-connection') {
    const speechKey = process.env.AZURE_SPEECH_KEY
    if (speechKey) {
      try {
        const speechRegion = process.env.AZURE_SPEECH_REGION || 'eastus'
        const response = await fetch(
          `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': speechKey,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )
        if (response.ok) {
          return res.status(200).json({ success: true, connected: true, message: 'Edge TTS (Azure) conectado!' })
        } else {
          return res.status(400).json({ success: false, connected: false, message: 'Erro na conexão com Azure Speech' })
        }
      } catch {
        return res.status(400).json({ success: false, connected: false, message: 'Erro de rede com Azure Speech' })
      }
    } else {
      return res.status(200).json({ success: false, connected: false, needsConfiguration: true, message: 'Azure Speech Key não configurada' })
    }
  }

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' })
  }

  const maxLength = 5000
  const truncatedText = text.slice(0, maxLength)
  const selectedVoice = EDGE_VOICES[voice as keyof typeof EDGE_VOICES] || EDGE_VOICES['default']

  const speechKey = process.env.AZURE_SPEECH_KEY
  const speechRegion = process.env.AZURE_SPEECH_REGION || 'eastus'

  if (speechKey) {
    const tokenResponse = await fetch(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Azure token')
    }

    const accessToken = await tokenResponse.text()

    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR">
        <voice name="${selectedVoice}">
          <prosody rate="${rate}" pitch="${pitch}">
            ${escapeXml(truncatedText)}
          </prosody>
        </voice>
      </speak>
    `.trim()

    const audioResponse = await fetch(
      `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        },
        body: ssml,
      }
    )

    if (!audioResponse.ok) {
      throw new Error('Failed to generate audio')
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`

    const wordCount = truncatedText.split(/\s+/).length
    const estimatedDuration = Math.ceil((wordCount / 150) * 60)

    return res.status(200).json({
      success: true,
      audioUrl,
      duration: estimatedDuration,
      voice: selectedVoice,
      textLength: truncatedText.length,
      cost: 0,
    })
  }

  return res.status(200).json({
    success: true,
    audioUrl: null,
    message: 'Azure Speech key not configured. Configure AZURE_SPEECH_KEY for real TTS.',
    duration: Math.ceil((truncatedText.split(/\s+/).length / 150) * 60),
    voice: selectedVoice,
    textLength: truncatedText.length,
    cost: 0,
    needsConfiguration: true,
  })
}

// ============== ELEVENLABS ==============
async function handleElevenLabs(_req: VercelRequest, res: VercelResponse, action: string, data: any) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' })
  }

  const { text, voice = 'portuguese-female' } = data

  if (action === 'test' || action === 'test-connection') {
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': apiKey },
    })
    if (response.ok) {
      return res.status(200).json({ success: true, connected: true, message: 'ElevenLabs conectado!' })
    } else {
      return res.status(400).json({ success: false, connected: false, message: 'Erro na conexão com ElevenLabs' })
    }
  }

  const voiceId = ELEVENLABS_VOICES[voice as keyof typeof ELEVENLABS_VOICES] || ELEVENLABS_VOICES['portuguese-female']

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    return res.status(400).json({ error: error.detail?.message || 'Failed to generate audio' })
  }

  const audioBuffer = await response.arrayBuffer()
  const base64Audio = Buffer.from(audioBuffer).toString('base64')
  const audioUrl = `data:audio/mpeg;base64,${base64Audio}`

  const wordsPerMinute = 150
  const wordCount = text.split(/\s+/).length
  const duration = Math.ceil((wordCount / wordsPerMinute) * 60)

  return res.status(200).json({ audioUrl, duration })
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
