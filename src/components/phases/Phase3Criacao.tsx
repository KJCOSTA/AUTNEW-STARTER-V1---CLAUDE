import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image,
  Sparkles,
  Check,
  RefreshCw,
  Loader2,
  Wand2,
  Settings2,
  FlaskConical,
  FileText,
  Edit3,
  Type,
  Film,
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
import type { TitleVariant, ThumbVariant } from '../../types'
import { CRIACAO_TO_ESTUDIO_ACTIONS, estimateCost } from '../../config/aiRegistry'

interface Phase3CriacaoProps {
  onNext: () => void
  onBack: () => void
}

// Cost estimates for thumbnail generation (using DALL-E 3)
const THUMBNAIL_COST = 0.04

// Mock title variants generator for Test Mode
function getMockTitleVariants(tema: string, gatilhos: string[]): TitleVariant[] {
  const gatilho0 = gatilhos[0] || 'esperança'

  return [
    {
      id: 1,
      titulo: `${tema || 'Oração'} - Oração Poderosa Para Sua Vida`,
      goldenHook:
        'Você já sentiu que suas orações não estão sendo ouvidas? Nos próximos minutos, eu vou te mostrar como conectar seu coração diretamente com Deus...',
      descricao: 'Abordagem direta e pessoal, focando na conexão individual com Deus',
    },
    {
      id: 2,
      titulo: `PARE TUDO e Faça Esta Oração Agora - Oração Guiada`,
      goldenHook:
        'Esta oração mudou a vida de milhares de pessoas. E hoje, ela pode mudar a sua também...',
      descricao: 'Abordagem de urgência e prova social, criando senso de importância',
    },
    {
      id: 3,
      titulo: `A Oração Que Deus Sempre Ouve - ${gatilho0.charAt(0).toUpperCase() + gatilho0.slice(1)} e Fé`,
      goldenHook:
        'Existe uma forma de orar que toca o coração de Deus instantaneamente. E ela está esquecida pela maioria das pessoas...',
      descricao: 'Abordagem de curiosidade e revelação, prometendo conhecimento exclusivo',
    },
  ]
}

// Mock thumbnail variants generator for Test Mode
function getMockThumbVariants(): ThumbVariant[] {
  return [
    {
      id: 1,
      conceito:
        'Pessoa idosa de mãos postas em oração, luz dourada celestial ao fundo, expressão de paz e serenidade',
      prompt:
        'Elderly person with hands in prayer, golden celestial light background, peaceful serene expression, spiritual atmosphere, 16:9 aspect ratio, photorealistic, dramatic lighting',
      imageUrl: '', // Empty - user must generate
    },
    {
      id: 2,
      conceito:
        'Mãos erguidas para o céu com raios de luz, nuvens celestiais, atmosfera de milagre',
      prompt:
        'Hands raised to the sky with rays of light, celestial clouds, miracle atmosphere, spiritual, divine presence, 16:9 aspect ratio, photorealistic',
      imageUrl: '', // Empty - user must generate
    },
    {
      id: 3,
      conceito:
        'Bíblia aberta com luz emanando, ambiente acolhedor e espiritual, tons quentes',
      prompt:
        'Open Bible with light emanating, cozy spiritual environment, warm tones, divine presence, holy book, 16:9 aspect ratio, photorealistic',
      imageUrl: '', // Empty - user must generate
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
  const [regeneratingScript, setRegeneratingScript] = useState(false)

  // Model selection per action for next phase - using AI Registry
  const [modelSelections, setModelSelections] = useState<Record<string, { provider: string; model: string }>>(
    CRIACAO_TO_ESTUDIO_ACTIONS.reduce((acc, action) => ({
      ...acc,
      [action.id]: { provider: action.defaultProvider, model: action.defaultModel }
    }), {})
  )
  const [showModelConfig, setShowModelConfig] = useState(false)

  // Generate all content on mount if not already generated
  useEffect(() => {
    if (criacao.titleVariants.length === 0 && criacao.thumbVariants.length === 0) {
      generateAllContent()
    }
  }, [])

  // Generate script + title variants + thumb variants
  const generateAllContent = async () => {
    setGenerating(true)
    try {
      let titleVariants: TitleVariant[]
      let thumbVariants: ThumbVariant[]
      let roteiro: string

      if (isTestMode) {
        await new Promise(r => setTimeout(r, 2000))
        titleVariants = getMockTitleVariants(gatilho.tema, gatilho.gatilhosEmocionais)
        thumbVariants = getMockThumbVariants()
        roteiro = getMockRoteiro(
          gatilho.tema,
          titleVariants[0].titulo,
          titleVariants[0].goldenHook
        )
        addToast({ type: 'success', message: '[TEST MODE] Conteúdo gerado!' })
      } else {
        // Real API call
        try {
          const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'generate-video-content',
              tema: gatilho.tema,
              tipoConteudo: gatilho.tipoConteudo,
              gatilhos: gatilho.gatilhosEmocionais,
              duracao: gatilho.duracao,
              diretrizes,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            titleVariants = data.titleVariants || getMockTitleVariants(gatilho.tema, gatilho.gatilhosEmocionais)
            thumbVariants = data.thumbVariants || getMockThumbVariants()
            roteiro = data.script || getMockRoteiro(gatilho.tema, titleVariants[0].titulo, titleVariants[0].goldenHook)
          } else {
            throw new Error('API Error')
          }
        } catch {
          titleVariants = getMockTitleVariants(gatilho.tema, gatilho.gatilhosEmocionais)
          thumbVariants = getMockThumbVariants()
          roteiro = getMockRoteiro(gatilho.tema, titleVariants[0].titulo, titleVariants[0].goldenHook)
        }
        addToast({ type: 'success', message: 'Conteúdo gerado com sucesso!' })
      }

      // Ensure thumbs have no imageUrl (user must generate)
      thumbVariants = thumbVariants.map(t => ({ ...t, imageUrl: '' }))

      setCriacao({
        titleVariants,
        thumbVariants,
        roteiro,
        // Also populate legacy fields for compatibility
        opcoes: titleVariants.map((t, i) => ({
          id: t.id,
          titulo: t.titulo,
          conceitoThumbnail: thumbVariants[i]?.conceito || '',
          goldenHook: t.goldenHook,
          thumbnailUrl: '',
          thumbnailPrompt: thumbVariants[i]?.prompt || '',
        })),
        opcaoSelecionada: null,
      })
    } catch {
      addToast({ type: 'error', message: 'Erro ao gerar conteúdo' })
    } finally {
      setGenerating(false)
    }
  }

  // Update a specific title variant
  const updateTitleVariant = (id: number, field: keyof TitleVariant, value: string) => {
    const updated = criacao.titleVariants.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    )
    setCriacao({ titleVariants: updated })
  }

  // Update a specific thumb variant
  const updateThumbVariant = (id: number, field: keyof ThumbVariant, value: string) => {
    const updated = criacao.thumbVariants.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    )
    setCriacao({ thumbVariants: updated })
  }

  // Generate thumbnail for a specific variant
  const generateThumbnail = async (thumbId: number) => {
    const thumb = criacao.thumbVariants.find(t => t.id === thumbId)
    if (!thumb) return

    setGeneratingThumb(thumbId)
    try {
      if (isTestMode) {
        await new Promise(r => setTimeout(r, 1000))
        const updated = criacao.thumbVariants.map(t =>
          t.id === thumbId
            ? { ...t, imageUrl: `https://picsum.photos/seed/thumb${Date.now()}/1280/720` }
            : t
        )
        setCriacao({ thumbVariants: updated })
        addToast({ type: 'success', message: '[TEST MODE] Thumbnail simulada!' })
      } else {
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-thumbnail',
            prompt: thumb.prompt || thumb.conceito,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const updated = criacao.thumbVariants.map(t =>
            t.id === thumbId ? { ...t, imageUrl: data.imageUrl } : t
          )
          setCriacao({ thumbVariants: updated })
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
      for (const thumb of criacao.thumbVariants) {
        if (!thumb.imageUrl) {
          await generateThumbnail(thumb.id)
        }
      }
      addToast({ type: 'success', message: 'Todas as thumbnails geradas!' })
    } catch {
      addToast({ type: 'error', message: 'Erro ao gerar thumbnails' })
    } finally {
      setGeneratingAllThumbs(false)
    }
  }

  // Regenerate script
  const regenerateScript = async () => {
    if (criacao.titleVariants.length === 0) {
      addToast({ type: 'warning', message: 'Gere o conteúdo primeiro' })
      return
    }

    setRegeneratingScript(true)
    try {
      const firstTitle = criacao.titleVariants[0]

      let roteiro: string

      if (isTestMode) {
        await new Promise(r => setTimeout(r, 2000))
        roteiro = getMockRoteiro(
          gatilho.tema,
          firstTitle.titulo,
          firstTitle.goldenHook
        )
        addToast({ type: 'success', message: '[TEST MODE] Roteiro regenerado!' })
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
              titulo: firstTitle.titulo,
              goldenHook: firstTitle.goldenHook,
              diretrizes,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            roteiro = data.script || getMockRoteiro(gatilho.tema, firstTitle.titulo, firstTitle.goldenHook)
          } else {
            throw new Error('API Error')
          }
        } catch {
          roteiro = getMockRoteiro(gatilho.tema, firstTitle.titulo, firstTitle.goldenHook)
        }
        addToast({ type: 'success', message: 'Roteiro regenerado!' })
      }

      setCriacao({ roteiro })
    } catch {
      addToast({ type: 'error', message: 'Erro ao regenerar roteiro' })
    } finally {
      setRegeneratingScript(false)
    }
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
  const thumbsToGenerate = criacao.thumbVariants.filter(t => !t.imageUrl).length
  const totalThumbsCost = thumbsToGenerate * THUMBNAIL_COST

  // Can proceed if we have content
  const canProceed = criacao.titleVariants.length > 0 && criacao.roteiro.trim() !== ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header with Video Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Criação do Vídeo</CardTitle>
                <CardDescription>
                  {isTestMode
                    ? '[TEST MODE] 1 vídeo com 3 variações de título e thumbnail para teste A/B'
                    : '1 vídeo com 3 variações de título e thumbnail para teste A/B'}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateAllContent}
              loading={generating}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Regenerar Tudo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {generating && criacao.titleVariants.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue mx-auto mb-4" />
                <p className="text-text-secondary">
                  {isTestMode ? '[TEST MODE] Gerando conteúdo...' : 'Gerando roteiro e variações...'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-accent-blue/5 border border-accent-blue/10 rounded-xl">
              <Check className="w-5 h-5 text-accent-blue" />
              <div>
                <p className="text-sm text-text-primary font-medium">Modelo YouTube Ready</p>
                <p className="text-xs text-text-secondary">
                  Este vídeo será publicado com 3 opções de título e 3 opções de thumbnail para teste A/B nativo do YouTube.
                </p>
              </div>
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
                <CardTitle>Roteiro do Vídeo (Único)</CardTitle>
                <CardDescription>
                  O mesmo roteiro será usado para todas as variações de título
                </CardDescription>
              </div>
            </div>
            {criacao.roteiro && (
              <Button
                variant="ghost"
                size="sm"
                onClick={regenerateScript}
                loading={regeneratingScript}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Regenerar Roteiro
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {criacao.roteiro ? (
            <Textarea
              value={criacao.roteiro}
              onChange={(e) => setCriacao({ roteiro: e.target.value })}
              rows={15}
              className="font-mono text-sm"
              placeholder="O roteiro será gerado aqui..."
            />
          ) : (
            <div className="text-center py-12 text-text-secondary">
              {generating
                ? 'Gerando roteiro...'
                : 'Clique em "Regenerar Tudo" para gerar o roteiro'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Title Variants */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-status-success/20 flex items-center justify-center">
              <Type className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <CardTitle>3 Variações de Título</CardTitle>
              <CardDescription>
                Opções para teste A/B no YouTube - todas para o MESMO vídeo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {criacao.titleVariants.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              Aguardando geração de conteúdo...
            </div>
          ) : (
            <div className="space-y-4">
              {criacao.titleVariants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-status-success/20 text-status-success text-xs flex items-center justify-center font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-xs text-text-secondary">
                      Variação {index + 1}
                    </span>
                  </div>

                  {/* Editable Title */}
                  <div className="mb-3">
                    <label className="flex items-center gap-1 text-xs text-text-secondary mb-1">
                      <Edit3 className="w-3 h-3" />
                      Título
                    </label>
                    <input
                      type="text"
                      value={variant.titulo}
                      onChange={(e) => updateTitleVariant(variant.id, 'titulo', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                    />
                  </div>

                  {/* Editable Golden Hook */}
                  <div className="mb-3">
                    <label className="flex items-center gap-1 text-xs text-accent-blue mb-1">
                      <Sparkles className="w-3 h-3" />
                      Golden Hook
                    </label>
                    <textarea
                      value={variant.goldenHook}
                      onChange={(e) => updateTitleVariant(variant.id, 'goldenHook', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-accent-blue/5 border border-accent-blue/20 rounded-lg text-xs text-text-secondary resize-none focus:outline-none focus:border-accent-blue"
                    />
                  </div>

                  {/* Description */}
                  <div className="p-2 bg-white/5 rounded-lg">
                    <p className="text-xs text-text-secondary">
                      <strong>Abordagem:</strong> {variant.descricao}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Thumbnail Variants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                <Image className="w-5 h-5 text-accent-purple" />
              </div>
              <div>
                <CardTitle>3 Variações de Thumbnail</CardTitle>
                <CardDescription>
                  Opções para teste A/B no YouTube - todas para o MESMO vídeo
                </CardDescription>
              </div>
            </div>
            {thumbsToGenerate > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={generateAllThumbnails}
                loading={generatingAllThumbs}
                disabled={generatingThumb !== null}
                icon={<Image className="w-4 h-4" />}
              >
                Gerar Todas ~${totalThumbsCost.toFixed(2)}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {criacao.thumbVariants.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              Aguardando geração de conteúdo...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {criacao.thumbVariants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-accent-purple/20 text-accent-purple text-xs flex items-center justify-center font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-xs text-text-secondary">
                      Thumbnail {index + 1}
                    </span>
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="aspect-video rounded-lg bg-card mb-3 overflow-hidden relative border border-white/5">
                    {variant.imageUrl ? (
                      <>
                        <img
                          src={variant.imageUrl}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => generateThumbnail(variant.id)}
                          disabled={generatingThumb === variant.id}
                          className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 hover:bg-black/90 rounded text-xs text-white flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw className={`w-3 h-3 ${generatingThumb === variant.id ? 'animate-spin' : ''}`} />
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
                          onClick={() => generateThumbnail(variant.id)}
                          loading={generatingThumb === variant.id}
                          icon={<Wand2 className="w-3 h-3" />}
                        >
                          Gerar ~${THUMBNAIL_COST.toFixed(2)}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Editable Concept */}
                  <div className="mb-2">
                    <label className="flex items-center gap-1 text-xs text-text-secondary mb-1">
                      <Edit3 className="w-3 h-3" />
                      Conceito Visual
                    </label>
                    <textarea
                      value={variant.conceito}
                      onChange={(e) => updateThumbVariant(variant.id, 'conceito', e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-text-secondary resize-none focus:outline-none focus:border-accent-purple"
                    />
                  </div>

                  {/* Editable Prompt */}
                  <div className="p-2 bg-white/5 rounded-lg">
                    <label className="flex items-center gap-1 text-xs text-accent-purple mb-1">
                      <FileText className="w-3 h-3" />
                      Prompt
                    </label>
                    <textarea
                      value={variant.prompt}
                      onChange={(e) => updateThumbVariant(variant.id, 'prompt', e.target.value)}
                      rows={3}
                      placeholder="Prompt para gerar a thumbnail..."
                      className="w-full px-2 py-1.5 bg-transparent border border-white/10 rounded text-[11px] text-text-secondary resize-none focus:outline-none focus:border-accent-purple font-mono"
                    />
                  </div>
                </div>
              ))}
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
            if (criacao.titleVariants.length === 0) {
              addToast({ type: 'warning', message: 'Aguarde a geração do conteúdo' })
              return
            }
            if (!criacao.roteiro.trim()) {
              addToast({ type: 'warning', message: 'O roteiro é obrigatório' })
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
