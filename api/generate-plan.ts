export default async function handler(req, res) {
  try {
    const { topic } = req.body || {};

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Topic is required in request body'
      });
    }

    // Validate authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.warn('[GENERATE PLAN] No authentication token provided');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication token required'
      });
    }

    // 1. ATTEMPT REAL OPENAI API CONNECTION
    if (process.env.OPENAI_API_KEY) {
      try {
        // TODO: Implement actual OpenAI API call here
        // Example:
        // const response = await fetch('https://api.openai.com/v1/chat/completions', {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({
        //     model: 'gpt-4',
        //     messages: [{ role: 'user', content: `Generate a strategic plan for: ${topic}` }]
        //   })
        // });

        console.warn('[GENERATE PLAN] OpenAI integration not implemented yet, using fallback');
        // Fall through to fallback
      } catch (e) {
        console.error('[GENERATE PLAN] OpenAI API failed:', e.message);
        // Fall through to fallback
      }
    } else {
      console.warn('[GENERATE PLAN] Missing OPENAI_API_KEY - using fallback');
    }

    // 2. FALLBACK RESPONSE (when OpenAI unavailable)
    console.log('⚠️ [GENERATE PLAN] Serving fallback plan for:', topic);

    return res.status(200).json({
      success: true,
      plan: {
        title: `Plano Estratégico para: ${topic}`,
        overview: "Este é um plano gerado pelo sistema de fallback. Configure OPENAI_API_KEY para planos personalizados por IA.",
        steps: [
          {
            day: 1,
            action: "Análise de Concorrência",
            details: `Pesquisar e identificar os top 5 competidores no nicho de ${topic}.`
          },
          {
            day: 2,
            action: "Criação de Conteúdo",
            details: `Gravar 3 vídeos curtos sobre ${topic} focando em valor único.`
          },
          {
            day: 3,
            action: "Distribuição e Engajamento",
            details: "Publicar no YouTube Shorts, TikTok e Instagram Reels com hashtags estratégicas."
          },
          {
            day: 4,
            action: "Análise e Otimização",
            details: "Revisar métricas de engajamento e ajustar estratégia baseada em performance."
          }
        ],
        metrics: {
          estimatedViews: 5000,
          difficulty: "Médio",
          timeCommitment: "1-2 horas/dia"
        }
      },
      _source: 'fallback',
      _warning: 'Using template plan - configure OPENAI_API_KEY for AI-generated plans'
    });

  } catch (error) {
    console.error('[GENERATE PLAN] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to generate plan',
      _source: 'error_fallback'
    });
  }
}
