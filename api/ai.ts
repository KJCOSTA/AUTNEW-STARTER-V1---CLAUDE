import type { VercelRequest, VercelResponse } from '@vercel/node'

// API URLs
const API_URLS = {
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  groq: 'https://api.groq.com/openai/v1',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { provider, action, ...data } = req.body

  if (!provider) {
    return res.status(400).json({ error: 'Provider is required (anthropic, openai, gemini, groq)' })
  }

  try {
    switch (provider) {
      case 'anthropic':
      case 'claude':
        return handleAnthropic(req, res, action, data)
      case 'openai':
        return handleOpenAI(req, res, action, data)
      case 'gemini':
        return handleGemini(req, res, action, data)
      case 'groq':
        return handleGroq(req, res, action, data)
      default:
        return res.status(400).json({ error: `Unknown provider: ${provider}` })
    }
  } catch (error) {
    console.error(`${provider} API error:`, error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// ============== ANTHROPIC (Claude) ==============
async function handleAnthropic(req: VercelRequest, res: VercelResponse, action: string, data: any) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  if (action === 'test' || action === 'test-connection') {
    const response = await fetch(API_URLS.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Diga "OK" em uma palavra.' }],
      }),
    })
    if (response.ok) {
      return res.status(200).json({ success: true, connected: true, message: 'Claude conectado!' })
    } else {
      const errorData = await response.json().catch(() => ({}))
      return res.status(400).json({ success: false, connected: false, message: errorData.error?.message || 'Erro na conexão com Claude' })
    }
  }

  if (action === 'deep-research') {
    const prompt = `Você é um especialista em espiritualidade e conteúdo religioso cristão.

Faça uma pesquisa profunda sobre o tema: "${data.tema}"

Considere:
- Tipo de conteúdo: ${data.tipoConteudo}
- Gatilhos emocionais: ${data.gatilhos?.join(', ')}

Retorne em formato JSON:
{
  "fatos": ["3-5 fatos bíblicos ou históricos relevantes"],
  "curiosidades": ["2-3 curiosidades interessantes sobre o tema"],
  "referencias": ["5-7 versículos bíblicos relacionados"]
}

Responda APENAS o JSON, sem texto adicional.`

    const response = await fetch(API_URLS.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const result = await response.json()
    const text = result.content?.[0]?.text || '{}'

    try {
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim()
      const deepResearch = JSON.parse(cleanJson)
      return res.status(200).json({ deepResearch })
    } catch {
      return res.status(200).json({
        deepResearch: {
          fatos: ['Erro ao processar pesquisa'],
          curiosidades: [],
          referencias: [],
        },
      })
    }
  }

  if (action === 'generate-options') {
    const prompt = `Você é um especialista em criação de conteúdo viral para YouTube no nicho de espiritualidade.

Tema: "${data.tema}"
Tipo: ${data.tipoConteudo}
Gatilhos: ${data.gatilhos?.join(', ')}
Duração: ${data.duracao}

Gere 3 opções criativas diferentes para título e thumbnail. Cada opção deve ser otimizada para CTR (taxa de clique).

Retorne em formato JSON:
{
  "options": [
    {
      "id": 1,
      "titulo": "Título otimizado para CTR",
      "conceitoThumbnail": "Descrição visual da thumbnail",
      "goldenHook": "Frase de abertura magnética para os primeiros 15 segundos",
      "thumbnailPrompt": "Prompt em inglês para gerar a thumbnail com IA"
    }
  ]
}

IMPORTANTE:
- Títulos devem ter no máximo 60 caracteres
- Use gatilhos de curiosidade e urgência
- Conceitos de thumbnail devem mostrar pessoas 60+ ou elementos celestiais
- Golden hooks devem criar conexão emocional imediata

Responda APENAS o JSON, sem texto adicional.`

    const response = await fetch(API_URLS.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const result = await response.json()
    const text = result.content?.[0]?.text || '{}'

    try {
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanJson)
      return res.status(200).json(parsed)
    } catch {
      return res.status(200).json({ options: [] })
    }
  }

  if (action === 'generate-script') {
    const prompt = `Você é um roteirista especializado em conteúdo espiritual para YouTube.

Crie um roteiro completo para o canal "Mundo da Prece" com as seguintes especificações:

Tema: "${data.tema}"
Tipo: ${data.tipoConteudo}
Título: ${data.titulo}
Golden Hook: ${data.goldenHook}
Duração: ${data.duracao}
Gatilhos emocionais: ${data.gatilhos?.join(', ')}
Observações: ${data.observacoes || 'Nenhuma'}

DIRETRIZES OBRIGATÓRIAS:
${JSON.stringify(data.diretrizes, null, 2)}

ESTRUTURA DO ROTEIRO:
1. [00:00-00:15] ABERTURA MAGNÉTICA - Use o Golden Hook fornecido
2. [00:15-00:30] GANCHO EMOCIONAL - Conecte com a dor/desejo do público 60+
3. [00:30-XX:XX] DESENVOLVIMENTO - Com pausas para respiração, tom suave
4. [XX:XX] CTA DO MEIO - Insira naturalmente o convite do E-book
5. [XX:XX] FECHAMENTO - Mensagem de esperança
6. [XX:XX] CTA FINAL - Inscrição + Grupo VIP

REGRAS:
- Nunca use palavras da lista negra
- Inclua indicações de [pausa] e [voz suave]
- Mencione versículos bíblicos quando apropriado
- Tom acolhedor e esperançoso
- Aproximadamente 1600 palavras

Retorne APENAS o roteiro formatado com timestamps.`

    const response = await fetch(API_URLS.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const result = await response.json()
    const script = result.content?.[0]?.text || ''

    return res.status(200).json({ script })
  }

  if (action === 'prompt') {
    const response = await fetch(API_URLS.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: data.maxTokens || 4096,
        messages: [{ role: 'user', content: data.prompt }],
      }),
    })

    const result = await response.json()

    return res.status(200).json({
      success: true,
      content: result.content?.[0]?.text || '',
      model: 'claude-3-5-sonnet',
      usage: result.usage,
    })
  }

  return res.status(400).json({ error: 'Invalid action' })
}

// ============== OPENAI ==============
async function handleOpenAI(req: VercelRequest, res: VercelResponse, action: string, data: any) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
  }

  if (action === 'test' || action === 'test-connection') {
    const response = await fetch(`${API_URLS.openai}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (response.ok) {
      return res.status(200).json({ success: true, connected: true, message: 'OpenAI conectado!' })
    } else {
      return res.status(400).json({ success: false, connected: false, message: 'Erro na conexão com OpenAI' })
    }
  }

  if (action === 'generate-thumbnail') {
    const response = await fetch(`${API_URLS.openai}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `Create a YouTube thumbnail image for a spiritual/prayer channel. Style: warm, celestial, hopeful. ${data.prompt}. NO TEXT in the image. Aspect ratio 16:9.`,
        n: 1,
        size: '1792x1024',
        quality: 'standard',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return res.status(400).json({ error: error.error?.message || 'Failed to generate image' })
    }

    const result = await response.json()
    const imageUrl = result.data?.[0]?.url

    return res.status(200).json({ imageUrl })
  }

  return res.status(400).json({ error: 'Invalid action' })
}

// ============== GEMINI ==============
async function handleGemini(req: VercelRequest, res: VercelResponse, action: string, data: any) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })
  }

  if (action === 'test' || action === 'test-connection') {
    const response = await fetch(`${API_URLS.gemini}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Diga "OK" em uma palavra.' }] }],
      }),
    })
    if (response.ok) {
      return res.status(200).json({ success: true, connected: true, message: 'Gemini conectado!' })
    } else {
      const errorData = await response.json().catch(() => ({}))
      return res.status(400).json({ success: false, connected: false, message: errorData.error?.message || 'Erro na conexão com Gemini' })
    }
  }

  if (action === 'analyze') {
    const tema = data.data?.tema || data.tema || 'Oração'
    const gatilhos = data.data?.gatilhos || data.gatilhos || []
    const tipoConteudo = data.data?.tipoConteudo || data.tipoConteudo || 'oracao'

    const prompt = `Você é um especialista em conteúdo religioso cristão e análise de canais do YouTube.

Faça uma análise completa para criação de conteúdo sobre o tema: "${tema}"

Considere:
- Tipo de conteúdo: ${tipoConteudo}
- Gatilhos emocionais: ${gatilhos.join(', ') || 'esperança, paz'}

Retorne em formato JSON:
{
  "deepResearch": {
    "fatos": ["4-5 fatos bíblicos ou históricos relevantes sobre o tema"],
    "curiosidades": ["2-3 curiosidades interessantes"],
    "referencias": ["5-7 versículos bíblicos relacionados"]
  },
  "analiseCanal": {
    "padroesSuccesso": ["3-4 padrões identificados para sucesso no nicho espiritual"],
    "melhoresHorarios": ["2-3 melhores horários para postar"],
    "retencaoMedia": "70-80%",
    "gatilhosEfetivos": ["2-3 gatilhos emocionais mais efetivos"]
  },
  "analiseConcorrente": {
    "elementosVirais": ["3-4 elementos que tornam vídeos virais neste nicho"],
    "estruturaNarrativa": ["3-4 elementos de estrutura narrativa eficiente"],
    "duracaoIdeal": "8-12 minutos"
  }
}

Responda APENAS o JSON, sem texto adicional.`

    const response = await fetch(`${API_URLS.gemini}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 },
      }),
    })

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

    try {
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim()
      const analysisData = JSON.parse(cleanJson)
      return res.status(200).json(analysisData)
    } catch {
      return res.status(200).json({
        deepResearch: {
          fatos: [`O tema "${tema}" é muito relevante no nicho espiritual`, 'Vídeos de oração têm alta retenção'],
          curiosidades: ['Thumbnails com luz dourada performam melhor'],
          referencias: ['Salmo 23:1', 'Filipenses 4:6-7', 'Mateus 6:9-13'],
        },
        analiseCanal: {
          padroesSuccesso: ['Narração calma e pausada', 'Música ambiente suave'],
          melhoresHorarios: ['6h da manhã', '20h'],
          retencaoMedia: '75%',
          gatilhosEfetivos: ['esperança', 'paz'],
        },
        analiseConcorrente: {
          elementosVirais: ['Títulos com palavras poderosas', 'Thumbnails com luz celestial'],
          estruturaNarrativa: ['Abertura emocional', 'Desenvolvimento gradual', 'Fechamento esperançoso'],
          duracaoIdeal: '10 minutos',
        },
      })
    }
  }

  if (action === 'deep-research') {
    const prompt = `Você é um especialista em espiritualidade e conteúdo religioso cristão.

Faça uma pesquisa profunda sobre o tema: "${data.tema}"

Considere:
- Tipo de conteúdo: ${data.tipoConteudo}
- Gatilhos emocionais: ${data.gatilhos?.join(', ')}

Retorne em formato JSON:
{
  "fatos": ["3-5 fatos bíblicos ou históricos relevantes"],
  "curiosidades": ["2-3 curiosidades interessantes sobre o tema"],
  "referencias": ["5-7 versículos bíblicos relacionados"]
}

Responda APENAS o JSON, sem texto adicional.`

    const response = await fetch(`${API_URLS.gemini}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 },
      }),
    })

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

    try {
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim()
      const deepResearch = JSON.parse(cleanJson)
      return res.status(200).json({ deepResearch })
    } catch {
      return res.status(200).json({
        deepResearch: {
          fatos: ['Erro ao processar pesquisa'],
          curiosidades: [],
          referencias: [],
        },
      })
    }
  }

  if (action === 'generate-options') {
    const prompt = `Você é um especialista em criação de conteúdo viral para YouTube no nicho de espiritualidade.

Tema: "${data.tema}"
Tipo: ${data.tipoConteudo}
Gatilhos: ${data.gatilhos?.join(', ')}
Duração: ${data.duracao}

Gere 3 opções criativas diferentes para título e thumbnail. Cada opção deve ser otimizada para CTR (taxa de clique).

Retorne em formato JSON:
{
  "options": [
    {
      "id": 1,
      "titulo": "Título otimizado para CTR",
      "conceitoThumbnail": "Descrição visual da thumbnail",
      "goldenHook": "Frase de abertura magnética para os primeiros 15 segundos",
      "thumbnailPrompt": "Prompt em inglês para gerar a thumbnail com IA"
    }
  ]
}

IMPORTANTE:
- Títulos devem ter no máximo 60 caracteres
- Use gatilhos de curiosidade e urgência
- Conceitos de thumbnail devem mostrar pessoas 60+ ou elementos celestiais
- Golden hooks devem criar conexão emocional imediata

Responda APENAS o JSON, sem texto adicional.`

    const response = await fetch(`${API_URLS.gemini}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9 },
      }),
    })

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

    try {
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanJson)
      return res.status(200).json(parsed)
    } catch {
      return res.status(200).json({ options: [] })
    }
  }

  if (action === 'generate-script') {
    const prompt = `Você é um roteirista especializado em conteúdo espiritual para YouTube.

Crie um roteiro completo para o canal "Mundo da Prece" com as seguintes especificações:

Tema: "${data.tema}"
Tipo: ${data.tipoConteudo}
Título: ${data.titulo}
Golden Hook: ${data.goldenHook}
Duração: ${data.duracao}
Gatilhos emocionais: ${data.gatilhos?.join(', ')}
Observações: ${data.observacoes || 'Nenhuma'}

DIRETRIZES OBRIGATÓRIAS:
${JSON.stringify(data.diretrizes, null, 2)}

ESTRUTURA DO ROTEIRO:
1. [00:00-00:15] ABERTURA MAGNÉTICA - Use o Golden Hook fornecido
2. [00:15-00:30] GANCHO EMOCIONAL - Conecte com a dor/desejo do público 60+
3. [00:30-XX:XX] DESENVOLVIMENTO - Com pausas para respiração, tom suave
4. [XX:XX] CTA DO MEIO - Insira naturalmente o convite do E-book
5. [XX:XX] FECHAMENTO - Mensagem de esperança
6. [XX:XX] CTA FINAL - Inscrição + Grupo VIP

REGRAS:
- Nunca use palavras da lista negra
- Inclua indicações de [pausa] e [voz suave]
- Mencione versículos bíblicos quando apropriado
- Tom acolhedor e esperançoso
- Aproximadamente 1600 palavras

Retorne APENAS o roteiro formatado com timestamps.`

    const response = await fetch(`${API_URLS.gemini}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    })

    const result = await response.json()
    const script = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return res.status(200).json({ script })
  }

  return res.status(400).json({ error: 'Invalid action' })
}

// ============== GROQ ==============
async function handleGroq(req: VercelRequest, res: VercelResponse, action: string, data: any) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'GROQ_API_KEY not configured',
      configured: false,
      needsConfiguration: true
    })
  }

  const { prompt, model = 'llama-3.1-70b-versatile', maxTokens = 2048 } = data

  if (action === 'test' || action === 'test-connection') {
    const response = await fetch(`${API_URLS.groq}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Diga "OK" em uma palavra.' }],
        max_tokens: 10,
      }),
    })

    if (response.ok) {
      return res.status(200).json({
        success: true,
        connected: true,
        message: 'Groq conectado!'
      })
    } else {
      const error = await response.json().catch(() => ({}))
      return res.status(400).json({
        success: false,
        connected: false,
        message: error.error?.message || 'Erro na conexão com Groq'
      })
    }
  }

  if (action === 'chat') {
    const response = await fetch(`${API_URLS.groq}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return res.status(400).json({ error: error.error?.message || 'Chat request failed' })
    }

    const responseData = await response.json()
    return res.status(200).json({
      content: responseData.choices?.[0]?.message?.content || '',
      model: responseData.model,
      usage: responseData.usage,
    })
  }

  return res.status(400).json({ error: 'Invalid action' })
}
