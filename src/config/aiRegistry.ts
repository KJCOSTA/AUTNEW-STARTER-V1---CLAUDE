// ============================================
// AUTNEW STARTER V1 - AI REGISTRY
// Central registry of AI providers, models and roles
// ============================================

// AI Roles - What each model is good at
export type AIRole =
  | 'analysis'      // Data analysis, competitor analysis
  | 'research'      // Deep research, fact finding
  | 'seo'           // SEO optimization, tags, descriptions
  | 'writing'       // Creative writing, scripts
  | 'emotion'       // Emotional content, spiritual text
  | 'logic'         // Logical reasoning, planning
  | 'fast'          // Quick responses, fallback
  | 'refinement'    // Polishing, editing
  | 'image-gen'     // Image generation
  | 'video-gen'     // Video generation
  | 'audio-gen'     // Audio/voice generation
  | 'assistant'     // General assistant tasks
  | 'reasoning'     // Complex reasoning

// Model definition
export interface AIModel {
  id: string
  name: string
  roles: AIRole[]
  costPer1kTokens?: number  // Estimated cost in USD
  maxTokens?: number
  description?: string
  speed: 'fast' | 'medium' | 'slow'
}

// Provider definition
export interface AIProvider {
  id: string
  name: string
  apiKeyField: string  // Which field in configuracoes.apiKeys
  models: AIModel[]
  type: 'api-key' | 'oauth'
  docsUrl?: string
}

// ============================================
// AI REGISTRY - Source of Truth
// ============================================

export const AI_REGISTRY: AIProvider[] = [
  // ==========================================
  // GOOGLE (Gemini)
  // ==========================================
  {
    id: 'google',
    name: 'Google (Gemini)',
    apiKeyField: 'gemini',
    type: 'api-key',
    docsUrl: 'https://ai.google.dev',
    models: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        roles: ['analysis', 'seo', 'fast', 'research'],
        costPer1kTokens: 0.0001,
        speed: 'fast',
        description: 'Rápido e econômico para análises',
      },
      {
        id: 'gemini-2.0-pro',
        name: 'Gemini 2.0 Pro',
        roles: ['analysis', 'research', 'writing', 'logic'],
        costPer1kTokens: 0.001,
        speed: 'medium',
        description: 'Análise profunda e pesquisa',
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        roles: ['analysis', 'writing', 'reasoning'],
        costPer1kTokens: 0.0005,
        speed: 'medium',
        description: 'Contexto longo, análise detalhada',
      },
    ],
  },

  // ==========================================
  // OPENAI
  // ==========================================
  {
    id: 'openai',
    name: 'OpenAI',
    apiKeyField: 'openai',
    type: 'api-key',
    docsUrl: 'https://platform.openai.com',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        roles: ['logic', 'assistant', 'reasoning', 'writing'],
        costPer1kTokens: 0.005,
        speed: 'medium',
        description: 'Modelo mais capaz da OpenAI',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        roles: ['fast', 'analysis', 'assistant'],
        costPer1kTokens: 0.00015,
        speed: 'fast',
        description: 'Rápido e econômico',
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        roles: ['logic', 'reasoning', 'writing'],
        costPer1kTokens: 0.01,
        speed: 'medium',
        description: 'Alta capacidade de raciocínio',
      },
      {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        roles: ['image-gen'],
        costPer1kTokens: 0.04,  // Per image
        speed: 'slow',
        description: 'Geração de imagens de alta qualidade',
      },
    ],
  },

  // ==========================================
  // ANTHROPIC (Claude)
  // ==========================================
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    apiKeyField: 'anthropic',
    type: 'api-key',
    docsUrl: 'https://console.anthropic.com',
    models: [
      {
        id: 'claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        roles: ['writing', 'emotion', 'reasoning', 'assistant'],
        costPer1kTokens: 0.003,
        speed: 'medium',
        description: 'Excelente para escrita emocional',
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        roles: ['writing', 'emotion', 'reasoning', 'logic'],
        costPer1kTokens: 0.015,
        speed: 'slow',
        description: 'Máxima qualidade de escrita',
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        roles: ['fast', 'refinement', 'assistant'],
        costPer1kTokens: 0.00025,
        speed: 'fast',
        description: 'Rápido para refinamentos',
      },
    ],
  },

  // ==========================================
  // GROQ (Ultra-fast inference)
  // ==========================================
  {
    id: 'groq',
    name: 'Groq',
    apiKeyField: 'groq',
    type: 'api-key',
    docsUrl: 'https://console.groq.com',
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        roles: ['fast', 'analysis', 'writing', 'assistant'],
        costPer1kTokens: 0.0001,
        speed: 'fast',
        description: 'Ultra-rápido via Groq',
      },
      {
        id: 'mixtral-8x7b',
        name: 'Mixtral 8x7B',
        roles: ['fast', 'analysis', 'logic'],
        costPer1kTokens: 0.00005,
        speed: 'fast',
        description: 'Rápido e eficiente',
      },
    ],
  },

  // ==========================================
  // ELEVENLABS (Audio)
  // ==========================================
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    apiKeyField: 'elevenlabs',
    type: 'api-key',
    docsUrl: 'https://elevenlabs.io',
    models: [
      {
        id: 'eleven_multilingual_v2',
        name: 'Multilingual V2',
        roles: ['audio-gen'],
        costPer1kTokens: 0.018,  // Per 1000 characters
        speed: 'medium',
        description: 'Narração em múltiplos idiomas',
      },
      {
        id: 'eleven_turbo_v2',
        name: 'Turbo V2',
        roles: ['audio-gen', 'fast'],
        costPer1kTokens: 0.009,
        speed: 'fast',
        description: 'Narração rápida',
      },
    ],
  },

  // ==========================================
  // STABILITY AI (Images)
  // ==========================================
  {
    id: 'stabilityai',
    name: 'Stability AI',
    apiKeyField: 'stabilityai',
    type: 'api-key',
    docsUrl: 'https://stability.ai',
    models: [
      {
        id: 'sdxl-1.0',
        name: 'SDXL 1.0',
        roles: ['image-gen'],
        costPer1kTokens: 0.002,  // Per image
        speed: 'medium',
        description: 'Geração de imagens de alta qualidade',
      },
      {
        id: 'sd3-medium',
        name: 'Stable Diffusion 3',
        roles: ['image-gen'],
        costPer1kTokens: 0.003,
        speed: 'medium',
        description: 'Última geração de SD',
      },
    ],
  },

  // ==========================================
  // REPLICATE (Various models)
  // ==========================================
  {
    id: 'replicate',
    name: 'Replicate',
    apiKeyField: 'replicate',
    type: 'api-key',
    docsUrl: 'https://replicate.com',
    models: [
      {
        id: 'flux-schnell',
        name: 'Flux Schnell',
        roles: ['image-gen', 'fast'],
        costPer1kTokens: 0.003,
        speed: 'fast',
        description: 'Geração de imagens rápida',
      },
      {
        id: 'flux-pro',
        name: 'Flux Pro',
        roles: ['image-gen'],
        costPer1kTokens: 0.05,
        speed: 'slow',
        description: 'Alta qualidade de imagem',
      },
    ],
  },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all models that support a specific role
 */
export function getModelsByRole(role: AIRole): { provider: AIProvider; model: AIModel }[] {
  const results: { provider: AIProvider; model: AIModel }[] = []

  for (const provider of AI_REGISTRY) {
    for (const model of provider.models) {
      if (model.roles.includes(role)) {
        results.push({ provider, model })
      }
    }
  }

  return results.sort((a, b) => {
    // Sort by speed (fast first), then by cost
    const speedOrder = { fast: 0, medium: 1, slow: 2 }
    const speedDiff = speedOrder[a.model.speed] - speedOrder[b.model.speed]
    if (speedDiff !== 0) return speedDiff
    return (a.model.costPer1kTokens || 0) - (b.model.costPer1kTokens || 0)
  })
}

/**
 * Get all models that support multiple roles (AND logic)
 */
export function getModelsByRoles(roles: AIRole[]): { provider: AIProvider; model: AIModel }[] {
  const results: { provider: AIProvider; model: AIModel }[] = []

  for (const provider of AI_REGISTRY) {
    for (const model of provider.models) {
      if (roles.every(role => model.roles.includes(role))) {
        results.push({ provider, model })
      }
    }
  }

  return results
}

/**
 * Get all models that support any of the roles (OR logic)
 */
export function getModelsByAnyRole(roles: AIRole[]): { provider: AIProvider; model: AIModel }[] {
  const results: { provider: AIProvider; model: AIModel }[] = []
  const seen = new Set<string>()

  for (const provider of AI_REGISTRY) {
    for (const model of provider.models) {
      const key = `${provider.id}:${model.id}`
      if (!seen.has(key) && roles.some(role => model.roles.includes(role))) {
        results.push({ provider, model })
        seen.add(key)
      }
    }
  }

  return results.sort((a, b) => {
    const speedOrder = { fast: 0, medium: 1, slow: 2 }
    const speedDiff = speedOrder[a.model.speed] - speedOrder[b.model.speed]
    if (speedDiff !== 0) return speedDiff
    return (a.model.costPer1kTokens || 0) - (b.model.costPer1kTokens || 0)
  })
}

/**
 * Get a specific model by provider and model ID
 */
export function getModel(providerId: string, modelId: string): { provider: AIProvider; model: AIModel } | null {
  const provider = AI_REGISTRY.find(p => p.id === providerId)
  if (!provider) return null

  const model = provider.models.find(m => m.id === modelId)
  if (!model) return null

  return { provider, model }
}

/**
 * Get all providers
 */
export function getAllProviders(): AIProvider[] {
  return AI_REGISTRY
}

/**
 * Get provider by ID
 */
export function getProvider(providerId: string): AIProvider | undefined {
  return AI_REGISTRY.find(p => p.id === providerId)
}

/**
 * Get the default model for a role
 */
export function getDefaultModelForRole(role: AIRole): { provider: AIProvider; model: AIModel } | null {
  const models = getModelsByRole(role)
  return models[0] || null
}

/**
 * Calculate estimated cost for a task
 */
export function estimateCost(
  providerId: string,
  modelId: string,
  estimatedTokens: number
): number {
  const result = getModel(providerId, modelId)
  if (!result) return 0

  return (result.model.costPer1kTokens || 0) * (estimatedTokens / 1000)
}

// ============================================
// ACTION DEFINITIONS FOR EACH PHASE TRANSITION
// ============================================

export interface PipelineAction {
  id: string
  label: string
  description: string
  requiredRoles: AIRole[]
  defaultProvider: string
  defaultModel: string
  estimatedTokens: number
}

// Gatilho -> Inteligência
export const GATILHO_TO_INTELIGENCIA_ACTIONS: PipelineAction[] = [
  {
    id: 'extract-intent',
    label: 'Extração de Intenção',
    description: 'Identificar tema, emoções e objetivo do conteúdo',
    requiredRoles: ['analysis', 'logic'],
    defaultProvider: 'google',
    defaultModel: 'gemini-2.5-flash',
    estimatedTokens: 2000,
  },
  {
    id: 'analyze-competitor',
    label: 'Análise de Concorrente',
    description: 'Analisar estrutura e elementos do vídeo concorrente',
    requiredRoles: ['analysis', 'research'],
    defaultProvider: 'google',
    defaultModel: 'gemini-2.0-pro',
    estimatedTokens: 5000,
  },
  {
    id: 'deep-research',
    label: 'Pesquisa Profunda',
    description: 'Buscar fatos, curiosidades e referências sobre o tema',
    requiredRoles: ['research', 'analysis'],
    defaultProvider: 'google',
    defaultModel: 'gemini-2.0-pro',
    estimatedTokens: 8000,
  },
]

// Inteligência -> Criação
export const INTELIGENCIA_TO_CRIACAO_ACTIONS: PipelineAction[] = [
  {
    id: 'generate-options',
    label: 'Geração de 3 Opções',
    description: 'Criar 3 variações de título, hook e conceito de thumbnail',
    requiredRoles: ['writing', 'emotion'],
    defaultProvider: 'anthropic',
    defaultModel: 'claude-3.5-sonnet',
    estimatedTokens: 4000,
  },
  {
    id: 'generate-thumbnails',
    label: 'Geração de 3 Thumbnails',
    description: 'Criar 3 imagens de thumbnail para teste A/B',
    requiredRoles: ['image-gen'],
    defaultProvider: 'openai',
    defaultModel: 'dall-e-3',
    estimatedTokens: 3,  // 3 images
  },
  {
    id: 'seo-optimization',
    label: 'Otimização SEO',
    description: 'Gerar tags, descrição otimizada e metadados',
    requiredRoles: ['seo', 'analysis'],
    defaultProvider: 'google',
    defaultModel: 'gemini-2.5-flash',
    estimatedTokens: 2000,
  },
]

// Criação -> Estúdio
export const CRIACAO_TO_ESTUDIO_ACTIONS: PipelineAction[] = [
  {
    id: 'generate-script',
    label: 'Geração do Roteiro',
    description: 'Criar roteiro completo seguindo as diretrizes',
    requiredRoles: ['writing', 'emotion'],
    defaultProvider: 'anthropic',
    defaultModel: 'claude-3.5-sonnet',
    estimatedTokens: 6000,
  },
  {
    id: 'refine-script',
    label: 'Refinamento do Roteiro',
    description: 'Polir e ajustar o roteiro final',
    requiredRoles: ['refinement', 'writing'],
    defaultProvider: 'anthropic',
    defaultModel: 'claude-3-haiku',
    estimatedTokens: 3000,
  },
]

// Estúdio -> Entrega (for production/full-ai modes)
export const ESTUDIO_TO_ENTREGA_ACTIONS: PipelineAction[] = [
  {
    id: 'generate-narration',
    label: 'Geração de Narração',
    description: 'Criar narração em áudio do roteiro',
    requiredRoles: ['audio-gen'],
    defaultProvider: 'elevenlabs',
    defaultModel: 'eleven_multilingual_v2',
    estimatedTokens: 5000,  // Characters
  },
  {
    id: 'generate-visuals',
    label: 'Geração de Visuais',
    description: 'Criar imagens para cada cena',
    requiredRoles: ['image-gen'],
    defaultProvider: 'openai',
    defaultModel: 'dall-e-3',
    estimatedTokens: 10,  // Images
  },
]
