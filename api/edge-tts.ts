import type { VercelRequest, VercelResponse } from '@vercel/node'

// Edge TTS voices for Brazilian Portuguese
const VOICES = {
  'francisca': 'pt-BR-FranciscaNeural', // Female - warm, empathetic
  'antonio': 'pt-BR-AntonioNeural',     // Male - calm, authoritative
  'default': 'pt-BR-FranciscaNeural',
}

interface TTSRequest {
  text: string
  voice?: keyof typeof VOICES
  rate?: string // e.g., "+0%", "-10%", "+20%"
  pitch?: string // e.g., "+0Hz", "-5Hz", "+10Hz"
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, voice = 'francisca', rate = '-5%', pitch = '+0Hz' } = req.body as TTSRequest

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' })
  }

  // Limit text length for free tier
  const maxLength = 5000
  const truncatedText = text.slice(0, maxLength)

  const selectedVoice = VOICES[voice] || VOICES['default']

  try {
    // Use edge-tts Python service or a proxy
    // For now, we'll use a public TTS API as fallback
    // In production, you'd set up your own edge-tts service

    // Option 1: Use Microsoft's Cognitive Services (free tier available)
    const speechKey = process.env.AZURE_SPEECH_KEY
    const speechRegion = process.env.AZURE_SPEECH_REGION || 'eastus'

    if (speechKey) {
      // Azure Cognitive Services TTS
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

      // Estimate duration (rough calculation: ~150 words per minute)
      const wordCount = truncatedText.split(/\s+/).length
      const estimatedDuration = Math.ceil((wordCount / 150) * 60)

      return res.status(200).json({
        success: true,
        audioUrl,
        duration: estimatedDuration,
        voice: selectedVoice,
        textLength: truncatedText.length,
        cost: 0, // Free with Azure free tier
      })
    }

    // Option 2: Fallback - return a sample/placeholder for testing
    // In production without Azure, you'd need to set up edge-tts locally
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

  } catch (error) {
    console.error('Edge TTS error:', error)
    return res.status(500).json({
      error: 'Failed to generate audio',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
