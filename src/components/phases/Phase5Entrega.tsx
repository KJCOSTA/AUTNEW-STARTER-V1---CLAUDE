import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Send,
  Download,
  Youtube,
  Image,
  FileText,
  Check,
  ExternalLink,
  Sparkles,
  Save,
  FlaskConical,
  Type,
  Copy,
  Info,
  Palette,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CopyButton,
} from '../ui'
import type { EntregaData, Producao, TitleVariant, ThumbVariant } from '../../types'

interface Phase5EntregaProps {
  onReset: () => void
}

export function Phase5Entrega({ onReset }: Phase5EntregaProps) {
  const {
    gatilho,
    criacao,
    estudio,
    entrega,
    setEntrega,
    configuracoes,
    addToast,
    addProducao,
  } = useStore()
  const [publishing, setPublishing] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const isMVP = configuracoes.modo === 'mvp'
  const isTestMode = configuracoes.appMode === 'test'

  // NEW MODEL: Get title and thumb variants from criacao
  const titleVariants = criacao.titleVariants || []
  const thumbVariants = criacao.thumbVariants || []
  const roteiro = criacao.roteiro || ''

  // LEGACY: Fallback for old model
  const selectedOption = criacao.opcoes.find(
    (o) => o.id === criacao.opcaoSelecionada
  )

  // Build delivery data with new model
  const deliveryData: EntregaData = entrega || {
    videoUrl: estudio.videoRenderizado,
    // NEW MODEL: Preserve all variants
    titleVariants: titleVariants,
    thumbVariants: thumbVariants,
    // LEGACY: Use first variant or selected option
    thumbnailUrl: thumbVariants[0]?.imageUrl || selectedOption?.thumbnailUrl || '',
    titulo: titleVariants[0]?.titulo || selectedOption?.titulo || '',
    descricaoSEO: generateDescription(),
    tags: generateTags(),
    roteiro: roteiro || '',
    promptThumbnail: thumbVariants[0]?.prompt || selectedOption?.thumbnailPrompt || selectedOption?.conceitoThumbnail || '',
    publicadoYouTube: false,
  }

  function generateDescription(): string {
    const firstTitle = titleVariants[0] || selectedOption
    return `${firstTitle?.goldenHook || ''}

🙏 ${gatilho.tema}

Neste vídeo, você encontrará uma ${
      gatilho.tipoConteudo === 'oracao-guiada'
        ? 'oração guiada'
        : gatilho.tipoConteudo === 'meditacao-espiritual'
        ? 'meditação espiritual'
        : 'reflexão'
    } especial para ${gatilho.gatilhosEmocionais.map((g) => g.replace('-', ' ')).join(', ')}.

📖 Versículos mencionados:
• Filipenses 4:6-7
• Salmo 23
• Mateus 6:25-34

🔔 Inscreva-se no canal e ative o sininho para receber mais orações!

📱 Entre no nosso Grupo VIP do WhatsApp: [LINK]
📚 Baixe nosso E-book gratuito: [LINK]

#oração #fé #espiritualidade #paz #esperança #mundodaprece #deus #jesus

⏰ Novos vídeos toda semana!

© ${new Date().getFullYear()} Mundo da Prece - Todos os direitos reservados`
  }

  function generateTags(): string[] {
    const baseTags = [
      'oração',
      'oração poderosa',
      'fé',
      'deus',
      'jesus cristo',
      'espiritualidade',
      'paz interior',
      'meditação cristã',
      'salmos',
      'bíblia',
    ]
    const triggerTags = gatilho.gatilhosEmocionais.map((t) =>
      t.replace('-', ' ')
    )
    const themeTags = gatilho.tema
      .toLowerCase()
      .split(' ')
      .filter((w) => w.length > 3)
    return [...new Set([...baseTags, ...triggerTags, ...themeTags])].slice(0, 30)
  }

  const handlePublish = async () => {
    // Test Mode: simulate publish
    if (isTestMode) {
      setPublishing(true)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setEntrega({ ...deliveryData, publicadoYouTube: true })
      addToast({
        type: 'success',
        message: scheduleDate
          ? '[TEST] Vídeo agendado com sucesso!'
          : '[TEST] Vídeo publicado com sucesso!',
      })
      setPublishing(false)
      return
    }

    if (!configuracoes.youtube.conectado) {
      addToast({
        type: 'warning',
        message: 'Conecte seu canal do YouTube nas Configurações',
      })
      return
    }

    setPublishing(true)
    try {
      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: deliveryData.titulo,
          description: deliveryData.descricaoSEO,
          tags: deliveryData.tags,
          thumbnailUrl: deliveryData.thumbnailUrl,
          videoUrl: deliveryData.videoUrl,
          scheduleDate: scheduleDate || undefined,
        }),
      })

      if (response.ok) {
        setEntrega({ ...deliveryData, publicadoYouTube: true })
        addToast({
          type: 'success',
          message: scheduleDate
            ? 'Vídeo agendado com sucesso!'
            : 'Vídeo publicado com sucesso!',
        })
      }
    } catch {
      addToast({ type: 'error', message: 'Erro ao publicar vídeo' })
    } finally {
      setPublishing(false)
    }
  }

  const handleSaveToHistory = () => {
    const producao: Producao = {
      id: Date.now().toString(),
      dataCriacao: new Date().toISOString(),
      tema: gatilho.tema,
      tipoConteudo: gatilho.tipoConteudo,
      duracao: gatilho.duracao,
      titulo: deliveryData.titulo,
      thumbnailUrl: deliveryData.thumbnailUrl,
      favorito: false,
      gatilho,
      criacao,
      estudio,
      entrega: deliveryData,
    }
    addProducao(producao)
    addToast({ type: 'success', message: 'Salvo no histórico!' })
  }

  const handleDownload = (type: 'video' | 'thumbnail' | 'roteiro') => {
    addToast({
      type: 'info',
      message: `Download de ${type} iniciado...`,
    })
  }

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    addToast({
      type: 'success',
      message: `${label} copiado!`,
    })
  }

  // Check if using new model (has variants)
  const hasNewModel = titleVariants.length > 0 || thumbVariants.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Success Header */}
      <div className="text-center py-6">
        {/* Test Mode Badge */}
        {isTestMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-status-warning/10 border border-status-warning/30 rounded-full text-status-warning text-sm mb-4"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Test Mode - Dados simulados</span>
          </motion.div>
        )}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-20 h-20 mx-auto mb-4 rounded-full bg-status-success/20 flex items-center justify-center"
        >
          <Check className="w-10 h-10 text-status-success" />
        </motion.div>
        <h2 className="text-2xl font-bold text-text-primary">
          Produção Concluída!
        </h2>
        <p className="text-text-secondary mt-2">
          Seu conteúdo está pronto para publicação
        </p>
      </div>

      {/* YouTube A/B Testing Info */}
      {hasNewModel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-xl"
        >
          <Info className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-accent-blue">
              Modelo YouTube Ready - A/B Testing
            </h4>
            <p className="text-xs text-accent-blue/80 mt-1">
              Você tem 3 variações de título e 3 de thumbnail para usar no YouTube Studio.
              O YouTube permite testar diferentes combinações para otimizar CTR automaticamente.
            </p>
          </div>
        </motion.div>
      )}

      {/* Title Variants Section */}
      {hasNewModel && titleVariants.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5 text-accent-purple" />
              <div>
                <CardTitle>Variações de Título</CardTitle>
                <CardDescription>
                  3 opções para teste A/B no YouTube
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {titleVariants.map((variant: TitleVariant, index: number) => (
                <motion.div
                  key={variant.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-accent-purple/20 text-accent-purple text-xs font-medium rounded">
                          Opção {variant.id}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {variant.descricao}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-text-primary">
                        {variant.titulo}
                      </p>
                      <p className="text-xs text-text-secondary mt-1 italic">
                        Hook: "{variant.goldenHook}"
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyToClipboard(variant.titulo, `Título ${variant.id}`)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Copiar título"
                    >
                      <Copy className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Thumbnail Variants Section */}
      {hasNewModel && thumbVariants.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-status-warning" />
              <div>
                <CardTitle>Variações de Thumbnail</CardTitle>
                <CardDescription>
                  3 opções visuais para teste A/B
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {thumbVariants.map((variant: ThumbVariant, index: number) => (
                <motion.div
                  key={variant.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-3"
                >
                  {/* Thumbnail Preview */}
                  <div className="aspect-video rounded-xl bg-card overflow-hidden border border-white/10">
                    {variant.imageUrl ? (
                      <img
                        src={variant.imageUrl}
                        alt={`Thumbnail ${variant.id}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-purple/20 to-accent-blue/20">
                        <Image className="w-8 h-8 text-text-secondary" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-status-warning/20 text-status-warning text-xs font-medium rounded">
                        Opção {variant.id}
                      </span>
                      <button
                        onClick={() => handleCopyToClipboard(variant.prompt, `Prompt ${variant.id}`)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Copiar prompt"
                      >
                        <Copy className="w-3 h-3 text-text-secondary" />
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {variant.conceito}
                    </p>
                  </div>

                  {/* Download Button */}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleDownload('thumbnail')}
                    icon={<Download className="w-3 h-3" />}
                  >
                    Download
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Prompts Section */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-text-primary mb-3">
                Prompts para geração
              </h4>
              <div className="space-y-2">
                {thumbVariants.map((variant: ThumbVariant) => (
                  <div
                    key={variant.id}
                    className="p-3 bg-background/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">
                        Prompt {variant.id}
                      </span>
                      <CopyButton text={variant.prompt} label={`Prompt ${variant.id}`} />
                    </div>
                    <p className="text-xs text-text-secondary/80 font-mono">
                      {variant.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legacy Preview Card (for old model or fallback) */}
      {!hasNewModel && (
        <Card variant="gradient">
          <CardContent className="p-6">
            <div className="flex gap-6">
              {/* Thumbnail Preview */}
              <div className="w-64 flex-shrink-0">
                <div className="aspect-video rounded-xl bg-card overflow-hidden">
                  {deliveryData.thumbnailUrl ? (
                    <img
                      src={deliveryData.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-text-secondary" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => handleDownload('thumbnail')}
                    icon={<Download className="w-3 h-3" />}
                  >
                    Thumb
                  </Button>
                  {!isMVP && deliveryData.videoUrl && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => handleDownload('video')}
                      icon={<Download className="w-3 h-3" />}
                    >
                      Vídeo
                    </Button>
                  )}
                </div>
              </div>

              {/* Content Preview */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary">Título</label>
                    <CopyButton text={deliveryData.titulo} label="Título" />
                  </div>
                  <p className="text-lg font-medium text-text-primary mt-1">
                    {deliveryData.titulo}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary">Tags</label>
                    <CopyButton
                      text={deliveryData.tags.join(', ')}
                      label="Tags"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {deliveryData.tags.slice(0, 8).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white/5 rounded text-xs text-text-secondary"
                      >
                        #{tag}
                      </span>
                    ))}
                    {deliveryData.tags.length > 8 && (
                      <span className="text-xs text-text-secondary">
                        +{deliveryData.tags.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags Section (for new model) */}
      {hasNewModel && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-accent-blue" />
                <CardTitle>Tags SEO</CardTitle>
              </div>
              <CopyButton
                text={deliveryData.tags.join(', ')}
                label="Tags"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {deliveryData.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white/5 rounded-lg text-sm text-text-secondary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-accent-blue" />
              <CardTitle>Descrição SEO</CardTitle>
            </div>
            <CopyButton text={deliveryData.descricaoSEO} label="Descrição" />
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-sm text-text-secondary whitespace-pre-wrap bg-background/50 p-4 rounded-xl max-h-60 overflow-y-auto">
            {deliveryData.descricaoSEO}
          </pre>
        </CardContent>
      </Card>

      {/* Script */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-accent-purple" />
              <CardTitle>Roteiro Único</CardTitle>
            </div>
            <div className="flex gap-2">
              <CopyButton text={deliveryData.roteiro} label="Roteiro" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownload('roteiro')}
                icon={<Download className="w-4 h-4" />}
              >
                Download
              </Button>
            </div>
          </div>
          <CardDescription>
            Roteiro do vídeo - único para todas as variações de título/thumbnail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-sm text-text-secondary whitespace-pre-wrap bg-background/50 p-4 rounded-xl max-h-60 overflow-y-auto font-mono">
            {deliveryData.roteiro || 'Roteiro não disponível'}
          </pre>
        </CardContent>
      </Card>

      {/* Publish Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Youtube className="w-5 h-5 text-red-500" />
            <CardTitle>Publicação no YouTube</CardTitle>
          </div>
          {hasNewModel && (
            <CardDescription>
              Após publicar, use as variações de título e thumbnail no YouTube Studio para configurar A/B testing
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {configuracoes.youtube.conectado || isTestMode ? (
            <>
              {isTestMode && !configuracoes.youtube.conectado && (
                <div className="flex items-center gap-2 px-3 py-2 bg-status-warning/10 border border-status-warning/20 rounded-lg text-xs text-status-warning mb-2">
                  <FlaskConical className="w-3 h-3" />
                  <span>Test Mode: Publicação será simulada</span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <Input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="flex-1"
                  label="Agendar para (opcional)"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handlePublish}
                  loading={publishing}
                  disabled={deliveryData.publicadoYouTube}
                  icon={
                    deliveryData.publicadoYouTube ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )
                  }
                  className="flex-1"
                >
                  {deliveryData.publicadoYouTube
                    ? 'Publicado!'
                    : scheduleDate
                    ? 'Agendar Publicação'
                    : 'Publicar Agora'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-text-secondary mb-3">
                Conecte seu canal para publicar diretamente
              </p>
              <Button
                variant="secondary"
                icon={<ExternalLink className="w-4 h-4" />}
              >
                Ir para Configurações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Actions */}
      <div className="flex justify-between pt-4">
        <Button
          variant="secondary"
          onClick={handleSaveToHistory}
          icon={<Save className="w-4 h-4" />}
        >
          Salvar no Histórico
        </Button>
        <Button onClick={onReset} icon={<Sparkles className="w-4 h-4" />}>
          Nova Produção
        </Button>
      </div>
    </motion.div>
  )
}
