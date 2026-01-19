import type { VercelRequest, VercelResponse } from '@vercel/node'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  const { action, ...data } = req.body

  try {
    if (action === 'test' || action === 'test-connection') {
      // Simple test request
      const response = await fetch(ANTHROPIC_API_URL, {
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

      const response = await fetch(ANTHROPIC_API_URL, {
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

      const response = await fetch(ANTHROPIC_API_URL, {
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

      const response = await fetch(ANTHROPIC_API_URL, {
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

    // Generic prompt call
    if (action === 'prompt') {
      const response = await fetch(ANTHROPIC_API_URL, {
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
  } catch (error) {
    console.error('Claude API error:', error)
    return res.status(500).json({ error: 'Falha ao chamar Claude API' })
  }
}
