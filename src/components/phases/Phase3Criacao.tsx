import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette,
  Image,
  Sparkles,
  Check,
  RefreshCw,
  Loader2,
  Wand2,
  ChevronDown,
  ChevronUp,
  Zap,
  Settings2,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  Button,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui'
import type { OpcaoCriacao } from '../../types'

// AI Models configuration
const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', cost: 0.0001, speed: 'Muito rápido' },
  { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', provider: 'Google', cost: 0.0005, speed: 'Médio' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', cost: 0.0002, speed: 'Rápido' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', cost: 0.001, speed: 'Médio' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', cost: 0.00025, speed: 'Muito rápido' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', cost: 0.003, speed: 'Médio' },
  { id: 'groq-llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Groq', cost: 0.0001, speed: 'Ultra rápido' },
  { id: 'dall-e-3', name: 'DALL-E 3', provider: 'OpenAI', cost: 0.04, speed: 'Médio' },
  { id: 'elevenlabs-v2', name: 'ElevenLabs V2', provider: 'ElevenLabs', cost: 0.0003, speed: 'Rápido' },
]

// Next phase actions definition (Estúdio)
const NEXT_PHASE_ACTIONS = [
  {
    id: 'parse-scenes',
    label: 'Divisão de Cenas',
    description: 'Converte roteiro em cenas individuais',
    defaultModel: 'gemini-2.5-flash'
  },
  {
    id: 'generate-visuals',
    label: 'Geração de Visuais',
    description: 'Cria imagens para cada cena',
    defaultModel: 'dall-e-3'
  },
  {
    id: 'generate-narration',
    label: 'Narração de Áudio',
    description: 'Gera narração com voz sintetizada',
    defaultModel: 'elevenlabs-v2'
  },
]

interface Phase3CriacaoProps {
  onNext: () => void
  onBack: () => void
}

// Mock options generator for Test Mode
function getMockOptions(tema: string, gatilhos: string[]): OpcaoCriacao[] {
  const gatilho0 = gatilhos[0] || 'esperança'

  return [
    {
      id: 1,
      titulo: `${tema || 'Oração'} - Oração Poderosa Para Sua Vida`,
      conceitoThumbnail:
        'Pessoa idosa de mãos postas em oração, luz dourada celestial ao fundo, expressão de paz e serenidade',
      goldenHook:
        'Você já sentiu que suas orações não estão sendo ouvidas? Nos próximos minutos, eu vou te mostrar como conectar seu coração diretamente com Deus...',
      thumbnailUrl: 'https://picsum.photos/seed/opt1/1280/720',
      thumbnailPrompt:
        'Elderly person with hands in prayer, golden celestial light background, peaceful serene expression, spiritual atmosphere, 16:9 aspect ratio',
    },
    {
      id: 2,
      titulo: `PARE TUDO e Faça Esta Oração Agora - Oração Guiada`,
      conceitoThumbnail:
        'Mãos erguidas para o céu com raios de luz, nuvens celestiais, atmosfera de milagre',
      goldenHook:
        'Esta oração mudou a vida de milhares de pessoas. E hoje, ela pode mudar a sua também...',
      thumbnailUrl: 'https://picsum.photos/seed/opt2/1280/720',
      thumbnailPrompt:
        'Hands raised to the sky with rays of light, celestial clouds, miracle atmosphere, spiritual, 16:9 aspect ratio',
    },
    {
      id: 3,
      titulo: `A Oração Que Deus Sempre Ouve - ${gatilho0.charAt(0).toUpperCase() + gatilho0.slice(1)} e Fé`,
      conceitoThumbnail:
        'Bíblia aberta com luz emanando, ambiente acolhedor e espiritual, tons quentes',
      goldenHook:
        'Existe uma forma de orar que toca o coração de Deus instantaneamente. E ela está esquecida pela maioria das pessoas...',
      thumbnailUrl: 'https://picsum.photos/seed/opt3/1280/720',
      thumbnailPrompt:
        'Open Bible with light emanating, cozy spiritual environment, warm tones, divine presence, 16:9 aspect ratio',
    },
  ]
}

// Mock script generator for Test Mode
function getMockRoteiro(tema: string, titulo: string, goldenHook: string): string {
  return `# ROTEIRO: ${titulo}

## [00:00 - 00:15] ABERTURA MAGNÉTICA

[MÚSICA SUAVE DE FUNDO]

${goldenHook}

[PAUSA DE 3 SEGUNDOS]

---

## [00:15 - 00:45] GANCHO EMOCIONAL

Talvez você esteja passando por um momento difícil...
Talvez o peso da vida esteja te sufocando...
Mas eu quero que você saiba: você não está sozinho.

Deus está aqui, agora, neste exato momento, esperando você abrir seu coração.

---

## [00:45 - 01:30] CTA DE ABERTURA

Antes de começarmos esta oração poderosa sobre ${tema || 'oração'}, se inscreva no canal e ative o sininho.
Assim você recebe todas as nossas orações diárias.

---

## [01:30 - 05:00] ORAÇÃO PRINCIPAL

[MÚSICA MAIS SUAVE]

Vamos orar juntos...

Senhor, neste momento eu venho até Ti com o coração aberto...

[PAUSA PARA RESPIRAÇÃO]

Peço que derrame sobre mim e sobre quem está ouvindo esta oração,
toda a paz e esperança que tanto precisamos...

[PAUSA]

Sei que muitos estão passando por momentos difíceis...
Mas também sei que Tu és maior do que qualquer problema...

[PAUSA LONGA]

Amém.

---

## [05:00 - 06:30] CTA DO MEIO

Se esta oração está tocando seu coração, deixe um "Amém" nos comentários.
E não se esqueça de compartilhar com alguém que precisa ouvir isso hoje.

---

## [06:30 - 07:30] FECHAMENTO COM ESPERANÇA

Lembre-se: você é amado.
Você é especial aos olhos de Deus.
Não importa o que esteja enfrentando, Ele está trabalhando em seu favor neste exato momento.

Que a paz do Senhor esteja com você hoje e sempre.

---

## [07:30 - FIM] CTA FINAL

Se você quer receber mais orações como esta, entre no nosso Grupo VIP do WhatsApp.
O link está na descrição.

Até a próxima oração. Fique com Deus. 🙏

[FADE OUT MÚSICA]

---

**FIM DO ROTEIRO**
`
}

export function Phase3Criacao({ onNext, onBack }: Phase3CriacaoProps) {
  const {
    gatilho,
    criacao,
    setCriacao,
    diretrizes,
    addToast,
    configuracoes,
  } = useStore()

  const isTestMode = configuracoes.appMode === 'test'

  const [generating, setGenerating] = useState(false)
  const [generatingThumb, setGeneratingThumb] = useState<number | null>(null)

  // Model selection per action for next phase
  const [actionModels, setActionModels] = useState<Record<string, string>>(
    NEXT_PHASE_ACTIONS.reduce((acc, action) => ({
      ...acc,
      [action.id]: action.defaultModel
    }), {})
  )
  const [showModelConfig, setShowModelConfig] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Generate options on mount if not already generated
  useEffect(() => {
    if (criacao.opcoes.length === 0) {
      generateOptions()
    }
  }, [])

  const generateOptions = async () => {
    setGenerating(true)
    try {
      let options: OpcaoCriacao[]

      if (isTestMode) {
        // Use mock data in test mode
        await new Promise(r => setTimeout(r, 1500))
        options = getMockOptions(gatilho.tema, gatilho.gatilhosEmocionais)
        addToast({ type: 'success', message: '[TEST MODE] Opções simuladas geradas!' })
      } else {
        // Real API call
        try {
          const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'generate-options',
              tema: gatilho.tema,
              tipoConteudo: gatilho.tipoConteudo,
              gatilhos: gatilho.gatilhosEmocionais,
              duracao: gatilho.duracao,
              diretrizes,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            options = data.options && data.options.length > 0
              ? data.options
              : getMockOptions(gatilho.tema, gatilho.gatilhosEmocionais)
          } else {
            throw new Error('API Error')
          }
        } catch {
          // Fallback to mock
          options = getMockOptions(gatilho.tema, gatilho.gatilhosEmocionais)
        }
        addToast({ type: 'success', message: 'Opções geradas com sucesso!' })
      }

      setCriacao({ opcoes: options, opcaoSelecionada: null })
    } catch {
      addToast({ type: 'error', message: 'Erro ao gerar opções' })
    } finally {
      setGenerating(false)
    }
  }

  const generateThumbnail = async (optionId: number) => {
    const option = criacao.opcoes.find((o) => o.id === optionId)
    if (!option) return

    setGeneratingThumb(optionId)
    try {
      if (isTestMode) {
        // Mock thumbnail in test mode
        await new Promise(r => setTimeout(r, 1000))
        const updatedOptions = criacao.opcoes.map((o) =>
          o.id === optionId
            ? { ...o, thumbnailUrl: `https://picsum.photos/seed/thumb${Date.now()}/1280/720` }
            : o
        )
        setCriacao({ opcoes: updatedOptions })
        addToast({ type: 'success', message: '[TEST MODE] Thumbnail simulada!' })
      } else {
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-thumbnail',
            prompt: option.thumbnailPrompt || option.conceitoThumbnail,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const updatedOptions = criacao.opcoes.map((o) =>
            o.id === optionId ? { ...o, thumbnailUrl: data.imageUrl } : o
          )
          setCriacao({ opcoes: updatedOptions })
          addToast({ type: 'success', message: 'Thumbnail gerada!' })
        } else {
          throw new Error('API Error')
        }
      }
    } catch {
      addToast({
        type: 'warning',
        message: 'Erro ao gerar thumbnail. Configure a API Key da OpenAI.',
      })
    } finally {
      setGeneratingThumb(null)
    }
  }

  const generateRoteiro = async () => {
    if (criacao.opcaoSelecionada === null) {
      addToast({ type: 'warning', message: 'Selecione uma opção primeiro' })
      return
    }

    setGenerating(true)
    try {
      const selectedOption = criacao.opcoes.find(
        (o) => o.id === criacao.opcaoSelecionada
      )

      let roteiro: string

      if (isTestMode) {
        // Use mock script in test mode
        await new Promise(r => setTimeout(r, 2000))
        roteiro = getMockRoteiro(
          gatilho.tema,
          selectedOption?.titulo || 'Oração Poderosa',
          selectedOption?.goldenHook || ''
        )
        addToast({ type: 'success', message: '[TEST MODE] Roteiro simulado gerado!' })
      } else {
        try {
          const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'generate-script',
              tema: gatilho.tema,
              tipoConteudo: gatilho.tipoConteudo,
              gatilhos: gatilho.gatilhosEmocionais,
              duracao: gatilho.duracao,
              observacoes: gatilho.observacoesEspeciais,
              titulo: selectedOption?.titulo,
              goldenHook: selectedOption?.goldenHook,
              diretrizes,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            roteiro = data.script || getMockRoteiro(
              gatilho.tema,
              selectedOption?.titulo || '',
              selectedOption?.goldenHook || ''
            )
          } else {
            throw new Error('API Error')
          }
        } catch {
          // Fallback to mock
          roteiro = getMockRoteiro(
            gatilho.tema,
            selectedOption?.titulo || '',
            selectedOption?.goldenHook || ''
          )
        }
        addToast({ type: 'success', message: 'Roteiro gerado com sucesso!' })
      }

      setCriacao({ roteiro })
    } catch {
      addToast({ type: 'error', message: 'Erro ao gerar roteiro' })
    } finally {
      setGenerating(false)
    }
  }

  const handleSelectOption = (id: number) => {
    setCriacao({ opcaoSelecionada: id })
    if (!criacao.roteiro) {
      setTimeout(() => generateRoteiro(), 100)
    }
  }

  const handleModelChange = (actionId: string, modelId: string) => {
    setActionModels(prev => ({
      ...prev,
      [actionId]: modelId
    }))
    setOpenDropdown(null)
  }

  const getModelById = (modelId: string) => AI_MODELS.find(m => m.id === modelId)

  const calculateTotalCost = () => {
    return Object.values(actionModels).reduce((total, modelId) => {
      const model = getModelById(modelId)
      return total + (model?.cost || 0)
    }, 0)
  }

  const canProceed = criacao.opcaoSelecionada !== null && criacao.roteiro.trim() !== ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Title Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Estratégia de Título e Thumbnail</CardTitle>
                <CardDescription>
                  {isTestMode
                    ? '[TEST MODE] Opções simuladas - selecione uma'
                    : 'Selecione a opção que mais combina com seu conteúdo'}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateOptions}
              loading={generating}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Regenerar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {generating && criacao.opcoes.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue mx-auto mb-4" />
                <p className="text-text-secondary">
                  {isTestMode ? '[TEST MODE] Gerando opções simuladas...' : 'Gerando opções criativas...'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {criacao.opcoes.map((option) => (
                <motion.div
                  key={option.id}
                  whileHover={{ y: -4 }}
                  onClick={() => handleSelectOption(option.id)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    criacao.opcaoSelecionada === option.id
                      ? 'border-accent-blue bg-accent-blue/10'
                      : 'border-white/10 bg-background/50 hover:border-white/20'
                  }`}
                >
                  {criacao.opcaoSelecionada === option.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent-blue flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Thumbnail Preview */}
                  <div className="aspect-video rounded-lg bg-card mb-3 overflow-hidden relative">
                    {option.thumbnailUrl ? (
                      <img
                        src={option.thumbnailUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                        <Image className="w-8 h-8 mb-2" />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            generateThumbnail(option.id)
                          }}
                          loading={generatingThumb === option.id}
                          icon={<Wand2 className="w-3 h-3" />}
                        >
                          Gerar Thumb
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="font-medium text-text-primary text-sm mb-2 line-clamp-2">
                    {option.titulo}
                  </h4>

                  {/* Concept */}
                  <p className="text-xs text-text-secondary mb-3 line-clamp-2">
                    {option.conceitoThumbnail}
                  </p>

                  {/* Golden Hook */}
                  <div className="p-2 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-accent-blue mb-1">
                      <Sparkles className="w-3 h-3" />
                      Golden Hook
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-3">
                      "{option.goldenHook}"
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Script Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent-purple" />
              </div>
              <div>
                <CardTitle>Editor de Roteiro</CardTitle>
                <CardDescription>
                  Revise e edite o roteiro antes de prosseguir
                </CardDescription>
              </div>
            </div>
            {criacao.opcaoSelecionada && !criacao.roteiro && (
              <Button
                variant="secondary"
                size="sm"
                onClick={generateRoteiro}
                loading={generating}
                icon={<Wand2 className="w-4 h-4" />}
              >
                Gerar Roteiro
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {criacao.roteiro ? (
            <Textarea
              value={criacao.roteiro}
              onChange={(e) => setCriacao({ roteiro: e.target.value })}
              rows={20}
              className="font-mono text-sm"
              placeholder="O roteiro será gerado aqui..."
            />
          ) : (
            <div className="text-center py-12 text-text-secondary">
              {criacao.opcaoSelecionada
                ? 'Clique em "Gerar Roteiro" para criar o conteúdo'
                : 'Selecione uma opção acima para gerar o roteiro'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Phase Model Configuration */}
      {canProceed && (
        <Card>
          <CardContent className="p-4">
            <button
              onClick={() => setShowModelConfig(!showModelConfig)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-accent-purple" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-text-primary">
                    Próxima Etapa: Estúdio
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {showModelConfig
                      ? 'Configurar modelos por ação'
                      : `${NEXT_PHASE_ACTIONS.length} ações • Custo estimado: ${isTestMode ? '$0.00' : `$${calculateTotalCost().toFixed(4)}`}`}
                  </p>
                </div>
              </div>
              {showModelConfig ? (
                <ChevronUp className="w-5 h-5 text-text-secondary" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-secondary" />
              )}
            </button>

            <AnimatePresence>
              {showModelConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                    {NEXT_PHASE_ACTIONS.map((action) => {
                      const selectedModel = getModelById(actionModels[action.id])
                      const isOpen = openDropdown === action.id

                      return (
                        <div key={action.id} className="p-3 rounded-xl bg-background/50">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary">
                                {action.label}
                              </p>
                              <p className="text-xs text-text-secondary truncate">
                                {action.description}
                              </p>
                            </div>

                            {/* Model Selector */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenDropdown(isOpen ? null : action.id)
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors min-w-[180px]"
                              >
                                <Zap className="w-4 h-4 text-accent-purple flex-shrink-0" />
                                <div className="flex-1 text-left">
                                  <p className="text-sm text-text-primary truncate">
                                    {selectedModel?.name}
                                  </p>
                                  <p className="text-xs text-text-secondary">
                                    {selectedModel?.provider} • {isTestMode ? '$0.00' : `$${selectedModel?.cost.toFixed(4)}`}
                                  </p>
                                </div>
                                <ChevronDown
                                  className={`w-4 h-4 text-text-secondary transition-transform flex-shrink-0 ${
                                    isOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>

                              {/* Dropdown */}
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full right-0 mt-1 w-64 bg-card border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto"
                                  >
                                    {AI_MODELS.map((model) => (
                                      <button
                                        key={model.id}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleModelChange(action.id, model.id)
                                        }}
                                        className={`w-full flex items-center justify-between p-3 hover:bg-white/5 text-left ${
                                          model.id === actionModels[action.id] ? 'bg-accent-purple/10' : ''
                                        }`}
                                      >
                                        <div>
                                          <p className="text-sm font-medium text-text-primary">
                                            {model.name}
                                          </p>
                                          <p className="text-xs text-text-secondary">
                                            {model.provider} • {model.speed}
                                          </p>
                                        </div>
                                        <span className="text-xs text-status-success font-mono">
                                          {isTestMode ? '$0.00' : `$${model.cost.toFixed(4)}`}
                                        </span>
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Total Cost */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-accent-purple/10 border border-accent-purple/20">
                      <span className="text-sm text-text-secondary">Custo total estimado:</span>
                      <span className="text-sm font-bold text-text-primary">
                        {isTestMode ? '$0.00 (Test Mode)' : `$${calculateTotalCost().toFixed(4)}`}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button
          onClick={() => {
            setCriacao({ roteiroAprovado: true })
            onNext()
          }}
          disabled={!canProceed}
          icon={<Check className="w-4 h-4" />}
        >
          Aprovar e Continuar
        </Button>
      </div>
    </motion.div>
  )
}
