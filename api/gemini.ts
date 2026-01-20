import type { VercelRequest, VercelResponse } from '@vercel/node'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })
  }

  const { action, ...data } = req.body

  try {
    if (action === 'test' || action === 'test-connection') {
      // Simple test request
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
      // Full analysis for Phase 2 - Intelligence
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

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
        // Return fallback data if JSON parsing fails
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

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
  } catch (error) {
    console.error('Gemini API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
