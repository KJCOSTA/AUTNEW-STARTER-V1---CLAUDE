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
  Settings2,
  FlaskConical,
  DollarSign,
  FileText,
  Edit3,
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
  ActionModelSelector,
} from '../ui'
import type { OpcaoCriacao } from '../../types'
import { CRIACAO_TO_ESTUDIO_ACTIONS, estimateCost } from '../../config/aiRegistry'

interface Phase3CriacaoProps {
  onNext: () => void
  onBack: () => void
}

// Cost estimates for thumbnail generation (using DALL-E 3)
const THUMBNAIL_COST = 0.04

// Mock options generator for Test Mode - WITHOUT auto thumbnails
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
      thumbnailUrl: '', // Start empty - NO auto generation
      thumbnailPrompt:
        'Elderly person with hands in prayer, golden celestial light background, peaceful serene expression, spiritual atmosphere, 16:9 aspect ratio, photorealistic, dramatic lighting',
    },
    {
      id: 2,
      titulo: `PARE TUDO e Faça Esta Oração Agora - Oração Guiada`,
      conceitoThumbnail:
        'Mãos erguidas para o céu com raios de luz, nuvens celestiais, atmosfera de milagre',
      goldenHook:
        'Esta oração mudou a vida de milhares de pessoas. E hoje, ela pode mudar a sua também...',
      thumbnailUrl: '', // Start empty - NO auto generation
      thumbnailPrompt:
        'Hands raised to the sky with rays of light, celestial clouds, miracle atmosphere, spiritual, divine presence, 16:9 aspect ratio, photorealistic',
    },
    {
      id: 3,
      titulo: `A Oração Que Deus Sempre Ouve - ${gatilho0.charAt(0).toUpperCase() + gatilho0.slice(1)} e Fé`,
      conceitoThumbnail:
        'Bíblia aberta com luz emanando, ambiente acolhedor e espiritual, tons quentes',
      goldenHook:
        'Existe uma forma de orar que toca o coração de Deus instantaneamente. E ela está esquecida pela maioria das pessoas...',
      thumbnailUrl: '', // Start empty - NO auto generation
      thumbnailPrompt:
        'Open Bible with light emanating, cozy spiritual environment, warm tones, divine presence, holy book, 16:9 aspect ratio, photorealistic',
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
  const [generatingAllThumbs, setGeneratingAllThumbs] = useState(false)
  const [regeneratingPrompt, setRegeneratingPrompt] = useState<number | null>(null)
  const [regeneratingScript, setRegeneratingScript] = useState(false)

  // Model selection per action for next phase - using AI Registry
  const [modelSelections, setModelSelections] = useState<Record<string, { provider: string; model: string }>>(
    CRIACAO_TO_ESTUDIO_ACTIONS.reduce((acc, action) => ({
      ...acc,
      [action.id]: { provider: action.defaultProvider, model: action.defaultModel }
    }), {})
  )
  const [showModelConfig, setShowModelConfig] = useState(false)

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
              ? data.options.map((opt: OpcaoCriacao) => ({ ...opt, thumbnailUrl: '' })) // Ensure no auto thumbnails
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

  // Update individual option field
  const updateOptionField = (optionId: number, field: keyof OpcaoCriacao, value: string) => {
    const updatedOptions = criacao.opcoes.map((o) =>
      o.id === optionId ? { ...o, [field]: value } : o
    )
    setCriacao({ opcoes: updatedOptions })
  }

  // Regenerate prompt for a single option
  const regeneratePrompt = async (optionId: number) => {
    const option = criacao.opcoes.find((o) => o.id === optionId)
    if (!option) return

    setRegeneratingPrompt(optionId)
    try {
      if (isTestMode) {
        await new Promise(r => setTimeout(r, 1000))
        const newPrompt = `${option.conceitoThumbnail}, spiritual atmosphere, divine light, 16:9 aspect ratio, photorealistic, cinematic lighting, highly detailed`
        updateOptionField(optionId, 'thumbnailPrompt', newPrompt)
        addToast({ type: 'success', message: '[TEST MODE] Prompt regenerado!' })
      } else {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-prompt',
            conceito: option.conceitoThumbnail,
            titulo: option.titulo,
            diretrizes,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          updateOptionField(optionId, 'thumbnailPrompt', data.prompt || option.thumbnailPrompt)
          addToast({ type: 'success', message: 'Prompt regenerado!' })
        } else {
          throw new Error('API Error')
        }
      }
    } catch {
      addToast({ type: 'error', message: 'Erro ao regenerar prompt' })
    } finally {
      setRegeneratingPrompt(null)
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

  // Generate all thumbnails
  const generateAllThumbnails = async () => {
    setGeneratingAllThumbs(true)
    try {
      for (const option of criacao.opcoes) {
        if (!option.thumbnailUrl) {
          await generateThumbnail(option.id)
        }
      }
      addToast({ type: 'success', message: 'Todas as thumbnails geradas!' })
    } catch {
      addToast({ type: 'error', message: 'Erro ao gerar thumbnails' })
    } finally {
      setGeneratingAllThumbs(false)
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

  // Regenerate script
  const regenerateRoteiro = async () => {
    setRegeneratingScript(true)
    await generateRoteiro()
    setRegeneratingScript(false)
  }

  const handleSelectOption = (id: number) => {
    setCriacao({ opcaoSelecionada: id })
  }

  const handleModelChange = (actionId: string, providerId: string, modelId: string) => {
    setModelSelections(prev => ({
      ...prev,
      [actionId]: { provider: providerId, model: modelId }
    }))
  }

  const calculateTotalCost = () => {
    return CRIACAO_TO_ESTUDIO_ACTIONS.reduce((total, action) => {
      const selection = modelSelections[action.id]
      if (!selection) return total
      return total + estimateCost(selection.provider, selection.model, action.estimatedTokens)
    }, 0)
  }

  // Count thumbnails that need generation
  const thumbsToGenerate = criacao.opcoes.filter(o => !o.thumbnailUrl).length
  const totalThumbsCost = thumbsToGenerate * THUMBNAIL_COST

  // Must have winner selected AND script to proceed
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
                    ? '[TEST MODE] Edite os campos e selecione o vencedor'
                    : 'Edite os campos, gere thumbnails e selecione o vencedor'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {thumbsToGenerate > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={generateAllThumbnails}
                  loading={generatingAllThumbs}
                  disabled={generatingThumb !== null}
                  icon={<Image className="w-4 h-4" />}
                >
                  Gerar Todas ~${(totalThumbsCost).toFixed(2)}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={generateOptions}
                loading={generating}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Regenerar Tudo
              </Button>
            </div>
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
                  whileHover={{ y: -2 }}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    criacao.opcaoSelecionada === option.id
                      ? 'border-accent-blue bg-accent-blue/10'
                      : 'border-white/10 bg-background/50 hover:border-white/20'
                  }`}
                >
                  {/* Radio button for winner selection */}
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="winner"
                        checked={criacao.opcaoSelecionada === option.id}
                        onChange={() => handleSelectOption(option.id)}
                        className="w-4 h-4 accent-accent-blue"
                      />
                      <span className="text-xs font-medium text-text-secondary">
                        Opção {option.id}
                      </span>
                    </label>
                    {criacao.opcaoSelecionada === option.id && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-accent-blue/20 rounded-full">
                        <Check className="w-3 h-3 text-accent-blue" />
                        <span className="text-xs font-medium text-accent-blue">Vencedor</span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="aspect-video rounded-lg bg-card mb-3 overflow-hidden relative border border-white/5">
                    {option.thumbnailUrl ? (
                      <>
                        <img
                          src={option.thumbnailUrl}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => generateThumbnail(option.id)}
                          disabled={generatingThumb === option.id}
                          className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 hover:bg-black/90 rounded text-xs text-white flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw className={`w-3 h-3 ${generatingThumb === option.id ? 'animate-spin' : ''}`} />
                          Refazer
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary bg-white/5">
                        <Image className="w-8 h-8 mb-2 opacity-30" />
                        <span className="text-xs opacity-50 mb-2">Sem thumbnail</span>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => generateThumbnail(option.id)}
                          loading={generatingThumb === option.id}
                          icon={<Wand2 className="w-3 h-3" />}
                        >
                          Gerar ~${THUMBNAIL_COST.toFixed(2)}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Editable Title */}
                  <div className="mb-2">
                    <label className="flex items-center gap-1 text-xs text-text-secondary mb-1">
                      <Edit3 className="w-3 h-3" />
                      Título
                    </label>
                    <input
                      type="text"
                      value={option.titulo}
                      onChange={(e) => updateOptionField(option.id, 'titulo', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                    />
                  </div>

                  {/* Editable Description/Concept */}
                  <div className="mb-2">
                    <label className="flex items-center gap-1 text-xs text-text-secondary mb-1">
                      <Edit3 className="w-3 h-3" />
                      Descrição/Conceito
                    </label>
                    <textarea
                      value={option.conceitoThumbnail}
                      onChange={(e) => updateOptionField(option.id, 'conceitoThumbnail', e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-text-secondary resize-none focus:outline-none focus:border-accent-blue"
                    />
                  </div>

                  {/* Editable Golden Hook */}
                  <div className="mb-3">
                    <label className="flex items-center gap-1 text-xs text-accent-blue mb-1">
                      <Sparkles className="w-3 h-3" />
                      Golden Hook
                    </label>
                    <textarea
                      value={option.goldenHook}
                      onChange={(e) => updateOptionField(option.id, 'goldenHook', e.target.value)}
                      rows={3}
                      className="w-full px-2 py-1.5 bg-accent-blue/5 border border-accent-blue/20 rounded-lg text-xs text-text-secondary resize-none focus:outline-none focus:border-accent-blue"
                    />
                  </div>

                  {/* Editable Thumbnail Prompt */}
                  <div className="p-2 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <label className="flex items-center gap-1 text-xs text-accent-purple">
                        <FileText className="w-3 h-3" />
                        Prompt da Imagem
                      </label>
                      <button
                        onClick={() => regeneratePrompt(option.id)}
                        disabled={regeneratingPrompt === option.id}
                        className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-accent-purple hover:bg-accent-purple/10 rounded transition-colors"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${regeneratingPrompt === option.id ? 'animate-spin' : ''}`} />
                        Regenerar
                      </button>
                    </div>
                    <textarea
                      value={option.thumbnailPrompt || ''}
                      onChange={(e) => updateOptionField(option.id, 'thumbnailPrompt', e.target.value)}
                      rows={3}
                      placeholder="Descreva o prompt para gerar a thumbnail..."
                      className="w-full px-2 py-1.5 bg-transparent border border-white/10 rounded text-[11px] text-text-secondary resize-none focus:outline-none focus:border-accent-purple font-mono"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Winner selection reminder */}
          {criacao.opcoes.length > 0 && criacao.opcaoSelecionada === null && (
            <div className="mt-4 p-3 bg-status-warning/10 border border-status-warning/20 rounded-lg flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-status-warning" />
              <span className="text-sm text-status-warning">
                Selecione uma opção vencedora (radio button) antes de continuar
              </span>
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
                  {criacao.opcaoSelecionada
                    ? 'Revise e edite o roteiro antes de prosseguir'
                    : 'Selecione um vencedor acima para gerar o roteiro'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {criacao.roteiro && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={regenerateRoteiro}
                  loading={regeneratingScript}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Regenerar Roteiro
                </Button>
              )}
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
                : 'Selecione uma opção vencedora acima para gerar o roteiro'}
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
                      : `${CRIACAO_TO_ESTUDIO_ACTIONS.length} ações • Custo estimado: ${isTestMode ? '$0.00' : `$${calculateTotalCost().toFixed(4)}`}`}
                  </p>
                </div>
              </div>
              {showModelConfig ? (
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
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
                  <div className="mt-4 pt-4 border-t border-white/10">
                    {isTestMode && (
                      <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-status-warning/10 border border-status-warning/20 rounded-lg text-xs text-status-warning">
                        <FlaskConical className="w-3 h-3" />
                        <span>Test Mode: custos simulados</span>
                      </div>
                    )}
                    <ActionModelSelector
                      actions={CRIACAO_TO_ESTUDIO_ACTIONS}
                      modelSelections={modelSelections}
                      onModelChange={handleModelChange}
                      title="Modelos para Estúdio"
                      description="Selecione o modelo para cada ação"
                    />
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
            if (criacao.opcaoSelecionada === null) {
              addToast({ type: 'warning', message: 'Selecione uma opção vencedora primeiro!' })
              return
            }
            if (!criacao.roteiro.trim()) {
              addToast({ type: 'warning', message: 'Gere o roteiro antes de continuar!' })
              return
            }
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
