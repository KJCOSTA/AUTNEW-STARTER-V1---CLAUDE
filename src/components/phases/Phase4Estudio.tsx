import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Film,
  Image,
  Volume2,
  Upload,
  RefreshCw,
  Clock,
  Check,
  Video,
  ChevronDown,
  ChevronUp,
  Zap,
  Settings2,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui'
import type { Cena } from '../../types'

// AI Models configuration
const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', cost: 0.0001, speed: 'Muito rápido' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', cost: 0.0002, speed: 'Rápido' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', cost: 0.00025, speed: 'Muito rápido' },
  { id: 'dall-e-3', name: 'DALL-E 3', provider: 'OpenAI', cost: 0.04, speed: 'Médio' },
  { id: 'json2video', name: 'JSON2Video', provider: 'JSON2Video', cost: 0.10, speed: 'Lento' },
]

// Next phase actions definition (Entrega)
const NEXT_PHASE_ACTIONS = [
  {
    id: 'generate-seo',
    label: 'Otimização SEO',
    description: 'Gera título, descrição e tags otimizados',
    defaultModel: 'gemini-2.5-flash'
  },
  {
    id: 'generate-final-thumb',
    label: 'Thumbnail Final',
    description: 'Versão final da thumbnail com texto',
    defaultModel: 'dall-e-3'
  },
  {
    id: 'prepare-upload',
    label: 'Preparação para Upload',
    description: 'Prepara metadados para YouTube',
    defaultModel: 'gpt-4o-mini'
  },
]

interface Phase4EstudioProps {
  onNext: () => void
  onBack: () => void
}

// Mock scenes generator for Test Mode
function getMockCenas(_roteiro: string): Cena[] {
  return [
    {
      id: 1,
      timestamp: '00:00-00:15',
      texto: 'ABERTURA MAGNÉTICA\n\nSe você chegou até aqui, não foi por acaso. Deus tem uma mensagem especial para você hoje...',
      visualSugerido: 'Nascer do sol sobre montanhas, luz dourada, atmosfera celestial',
      visualUrl: 'https://picsum.photos/seed/cena1/1920/1080',
      visualTipo: 'gerado',
    },
    {
      id: 2,
      timestamp: '00:15-00:45',
      texto: 'GANCHO EMOCIONAL\n\nQuantas vezes você se sentiu perdido, sem saber para onde ir? Quantas noites passou acordado, com o coração pesado?',
      visualSugerido: 'Pessoa contemplativa olhando para o horizonte, silhueta ao pôr do sol',
      visualUrl: 'https://picsum.photos/seed/cena2/1920/1080',
      visualTipo: 'stock',
    },
    {
      id: 3,
      timestamp: '00:45-01:30',
      texto: 'CTA DE ABERTURA\n\nAntes de começarmos, se inscreva no canal e ative o sininho para não perder nenhuma oração.',
      visualSugerido: 'Animação suave do botão de inscrição com fundo espiritual',
      visualUrl: 'https://picsum.photos/seed/cena3/1920/1080',
      visualTipo: 'gerado',
    },
    {
      id: 4,
      timestamp: '01:30-05:00',
      texto: 'ORAÇÃO PRINCIPAL\n\nVamos orar juntos... Senhor, neste momento eu venho até Ti com o coração aberto...',
      visualSugerido: 'Mãos unidas em oração com luz divina, velas acesas ao fundo',
      visualUrl: 'https://picsum.photos/seed/cena4/1920/1080',
      visualTipo: 'gerado',
    },
    {
      id: 5,
      timestamp: '05:00-06:30',
      texto: 'CTA DO MEIO\n\nSe esta oração está tocando seu coração, deixe um Amém nos comentários e compartilhe com alguém que precisa.',
      visualSugerido: 'Coração brilhante com partículas de luz, atmosfera esperançosa',
      visualUrl: 'https://picsum.photos/seed/cena5/1920/1080',
      visualTipo: 'gerado',
    },
    {
      id: 6,
      timestamp: '06:30-FIM',
      texto: 'FECHAMENTO\n\nQue a paz do Senhor esteja com você hoje e sempre. Fique com Deus.',
      visualSugerido: 'Céu estrelado com luz divina descendo, sensação de paz',
      visualUrl: 'https://picsum.photos/seed/cena6/1920/1080',
      visualTipo: 'gerado',
    },
  ]
}

export function Phase4Estudio({ onNext, onBack }: Phase4EstudioProps) {
  const { criacao, estudio, setEstudio, configuracoes, addToast } = useStore()
  const [processing, setProcessing] = useState(false)
  const [selectedCena, setSelectedCena] = useState<number | null>(null)

  const isMVP = configuracoes.modo === 'mvp'
  const isTestMode = configuracoes.appMode === 'test'

  // Model selection per action for next phase
  const [actionModels, setActionModels] = useState<Record<string, string>>(
    NEXT_PHASE_ACTIONS.reduce((acc, action) => ({
      ...acc,
      [action.id]: action.defaultModel
    }), {})
  )
  const [showModelConfig, setShowModelConfig] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Parse script into scenes
  useEffect(() => {
    if (estudio.cenas.length === 0 && criacao.roteiro) {
      parseScriptToScenes()
    }
  }, [criacao.roteiro])

  const parseScriptToScenes = () => {
    if (isTestMode) {
      // Use mock scenes in test mode
      const mockCenas = getMockCenas(criacao.roteiro)
      setEstudio({ cenas: mockCenas })
      addToast({ type: 'success', message: '[TEST MODE] Cenas simuladas carregadas!' })
      return
    }

    const script = criacao.roteiro
    const timestampRegex = /\[(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2}|FIM)\]\s*([^\n]+)\n([\s\S]*?)(?=\[\d{2}:\d{2}|$)/g
    const scenes: Cena[] = []
    let match
    let id = 1

    while ((match = timestampRegex.exec(script)) !== null) {
      const [, startTime, endTime, title, content] = match
      scenes.push({
        id: id++,
        timestamp: `${startTime}-${endTime}`,
        texto: `${title}\n${content.trim()}`,
        visualSugerido: getVisualSuggestion(title, content),
        visualTipo: 'stock',
      })
    }

    // If no timestamps found, split by sections
    if (scenes.length === 0) {
      const sections = script.split(/##\s*/).filter((p) => p.trim())

      sections.forEach((section, i) => {
        const lines = section.trim().split('\n')
        const title = lines[0] || `Cena ${i + 1}`
        const content = lines.slice(1).join('\n').trim()

        scenes.push({
          id: i + 1,
          timestamp: `Cena ${i + 1}`,
          texto: `${title}\n${content}`,
          visualSugerido: getVisualSuggestion(title, content),
          visualTipo: 'stock',
        })
      })
    }

    // Fallback if still no scenes
    if (scenes.length === 0) {
      const mockCenas = getMockCenas(script)
      setEstudio({ cenas: mockCenas })
      return
    }

    setEstudio({ cenas: scenes })
  }

  const getVisualSuggestion = (title: string, content: string): string => {
    const lower = (title + content).toLowerCase()
    if (lower.includes('abertura') || lower.includes('gancho')) {
      return 'Pessoa idosa em momento de reflexão, luz suave'
    }
    if (lower.includes('oração') || lower.includes('reza')) {
      return 'Mãos em oração, luz celestial, atmosfera serena'
    }
    if (lower.includes('silêncio') || lower.includes('meditação')) {
      return 'Paisagem tranquila, natureza, pôr do sol'
    }
    if (lower.includes('bíblia') || lower.includes('escritura')) {
      return 'Bíblia aberta com luz, ambiente acolhedor'
    }
    if (lower.includes('final') || lower.includes('encerramento') || lower.includes('fechamento')) {
      return 'Céu azul com nuvens, raios de sol, esperança'
    }
    if (lower.includes('cta') || lower.includes('inscreva')) {
      return 'Animação suave de inscrição, fundo espiritual'
    }
    return 'Imagem serena espiritual, tons quentes e acolhedores'
  }

  const generateAudioForScene = async (sceneId: number) => {
    if (isMVP && !isTestMode) {
      addToast({
        type: 'warning',
        message: 'Geração de áudio disponível apenas no Modo Produção',
      })
      return
    }

    setProcessing(true)
    try {
      const scene = estudio.cenas.find((c) => c.id === sceneId)
      if (!scene) return

      if (isTestMode) {
        // Mock audio in test mode
        await new Promise(r => setTimeout(r, 1500))
        const updatedCenas = estudio.cenas.map((c) =>
          c.id === sceneId
            ? { ...c, audioUrl: 'https://example.com/mock-audio.mp3', audioDuracao: 30 }
            : c
        )
        setEstudio({ cenas: updatedCenas })
        addToast({ type: 'success', message: '[TEST MODE] Áudio simulado gerado!' })
      } else {
        const response = await fetch('/api/elevenlabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: scene.texto,
            voice: 'portuguese-female',
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const updatedCenas = estudio.cenas.map((c) =>
            c.id === sceneId
              ? { ...c, audioUrl: data.audioUrl, audioDuracao: data.duration }
              : c
          )
          setEstudio({ cenas: updatedCenas })
          addToast({ type: 'success', message: 'Áudio gerado!' })
        }
      }
    } catch {
      addToast({ type: 'error', message: 'Erro ao gerar áudio' })
    } finally {
      setProcessing(false)
    }
  }

  const handleVisualUpload = (sceneId: number) => {
    if (isTestMode) {
      // Mock upload in test mode
      const updatedCenas = estudio.cenas.map((c) =>
        c.id === sceneId
          ? { ...c, visualUrl: `https://picsum.photos/seed/upload${Date.now()}/1920/1080`, visualTipo: 'upload' as const }
          : c
      )
      setEstudio({ cenas: updatedCenas })
      addToast({ type: 'success', message: '[TEST MODE] Upload simulado!' })
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const url = URL.createObjectURL(file)
        const updatedCenas = estudio.cenas.map((c) =>
          c.id === sceneId ? { ...c, visualUrl: url, visualTipo: 'upload' as const } : c
        )
        setEstudio({ cenas: updatedCenas })
        addToast({ type: 'success', message: 'Mídia carregada!' })
      }
    }
    input.click()
  }

  const renderVideo = async () => {
    if (isMVP && !isTestMode) {
      addToast({
        type: 'info',
        message: 'No modo MVP, use o checklist para montar no CapCut',
      })
      return
    }

    setProcessing(true)
    try {
      // Simulate render progress
      for (let i = 0; i <= 100; i += 10) {
        setEstudio({ progressoRenderizacao: i })
        await new Promise((r) => setTimeout(r, isTestMode ? 200 : 500))
      }

      if (isTestMode) {
        setEstudio({
          videoRenderizado: 'https://example.com/mock-video.mp4',
          progressoRenderizacao: 100
        })
        addToast({ type: 'success', message: '[TEST MODE] Vídeo simulado renderizado!' })
      } else {
        const response = await fetch('/api/json2video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenes: estudio.cenas,
            trilha: estudio.trilhaSonora,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setEstudio({ videoRenderizado: data.videoUrl, progressoRenderizacao: 100 })
          addToast({ type: 'success', message: 'Vídeo renderizado com sucesso!' })
        }
      }
    } catch {
      addToast({ type: 'error', message: 'Erro na renderização' })
    } finally {
      setProcessing(false)
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              Estúdio de Montagem
            </h2>
            <p className="text-sm text-text-secondary">
              {isTestMode
                ? '[TEST MODE] Cenas simuladas para visualização'
                : isMVP
                ? 'Revise as cenas e exporte para montagem manual'
                : 'Configure as cenas para renderização automática'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isTestMode && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
              TEST MODE
            </span>
          )}
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isMVP
                ? 'bg-status-warning/20 text-status-warning'
                : 'bg-status-success/20 text-status-success'
            }`}
          >
            Modo {isMVP ? 'MVP' : 'Produção'}
          </span>
        </div>
      </div>

      {/* Scenes List */}
      <Card>
        <CardHeader>
          <CardTitle>Cenas do Vídeo ({estudio.cenas.length})</CardTitle>
          <CardDescription>
            Clique em uma cena para ver detalhes e editar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {estudio.cenas.map((cena, index) => (
              <motion.div
                key={cena.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() =>
                  setSelectedCena(selectedCena === cena.id ? null : cena.id)
                }
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedCena === cena.id
                    ? 'border-accent-blue bg-accent-blue/5'
                    : 'border-white/10 bg-background/50 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Scene Number & Time */}
                  <div className="flex flex-col items-center">
                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-medium text-text-primary">
                      {cena.id}
                    </span>
                    <div className="flex items-center gap-1 mt-2 text-xs text-text-secondary">
                      <Clock className="w-3 h-3" />
                      {cena.timestamp}
                    </div>
                  </div>

                  {/* Visual Preview */}
                  <div className="w-24 h-16 rounded-lg bg-card flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {cena.visualUrl ? (
                      <img
                        src={cena.visualUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image className="w-6 h-6 text-text-secondary" />
                    )}
                  </div>

                  {/* Text Preview */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary line-clamp-2">
                      {cena.texto.split('\n')[0]}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      {cena.visualSugerido}
                    </p>
                  </div>

                  {/* Status Icons */}
                  <div className="flex items-center gap-2">
                    {cena.visualUrl && (
                      <div className="w-6 h-6 rounded-full bg-status-success/20 flex items-center justify-center">
                        <Image className="w-3 h-3 text-status-success" />
                      </div>
                    )}
                    {cena.audioUrl && (
                      <div className="w-6 h-6 rounded-full bg-status-success/20 flex items-center justify-center">
                        <Volume2 className="w-3 h-3 text-status-success" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedCena === cena.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 pt-4 border-t border-white/10 space-y-4"
                  >
                    {/* Full Text */}
                    <div className="p-3 bg-background rounded-lg">
                      <p className="text-sm text-text-secondary whitespace-pre-line">
                        {cena.texto}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVisualUpload(cena.id)
                        }}
                        icon={<Upload className="w-4 h-4" />}
                      >
                        {isTestMode ? 'Simular Upload' : 'Upload Visual'}
                      </Button>
                      {(!isMVP || isTestMode) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            generateAudioForScene(cena.id)
                          }}
                          loading={processing}
                          icon={<Volume2 className="w-4 h-4" />}
                        >
                          {isTestMode ? 'Simular Áudio' : 'Gerar Áudio'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<RefreshCw className="w-4 h-4" />}
                      >
                        Trocar Visual
                      </Button>
                    </div>

                    {/* Audio Player */}
                    {cena.audioUrl && !isTestMode && (
                      <audio controls className="w-full mt-2">
                        <source src={cena.audioUrl} type="audio/mpeg" />
                      </audio>
                    )}
                    {cena.audioUrl && isTestMode && (
                      <div className="p-2 bg-amber-500/10 rounded-lg text-xs text-amber-400">
                        [TEST MODE] Áudio simulado - {cena.audioUrl}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MVP Checklist / Production Render */}
      {(isMVP && !isTestMode) ? (
        <Card variant="gradient">
          <CardHeader>
            <CardTitle>Checklist de Produção Manual</CardTitle>
            <CardDescription>
              Use este guia para montar o vídeo no CapCut ou editor de sua preferência
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                'Grave a narração seguindo o roteiro (use voz nativa do CapCut se preferir)',
                'Importe os visuais para cada cena conforme sugestões',
                'Adicione transições suaves entre as cenas (fade ou dissolve)',
                'Insira trilha sonora calma ao fundo (30% do volume)',
                'Adicione legendas automáticas para acessibilidade',
                'Exporte em 1080p para qualidade ideal',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-text-secondary">{i + 1}</span>
                  </div>
                  <span className="text-sm text-text-primary">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {isTestMode ? '[TEST MODE] Renderização Simulada' : 'Renderização Automática'}
            </CardTitle>
            <CardDescription>
              {isTestMode
                ? 'Simulação do processo de renderização'
                : 'O sistema irá combinar áudio, vídeo e trilha automaticamente'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {estudio.progressoRenderizacao > 0 ? (
              <div className="space-y-4">
                <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${estudio.progressoRenderizacao}%` }}
                    className="absolute inset-y-0 left-0 bg-gradient-accent"
                  />
                </div>
                <p className="text-center text-sm text-text-secondary">
                  {estudio.progressoRenderizacao < 100
                    ? `${isTestMode ? '[MOCK] ' : ''}Renderizando... ${estudio.progressoRenderizacao}%`
                    : `${isTestMode ? '[MOCK] ' : ''}Renderização concluída!`}
                </p>
              </div>
            ) : (
              <Button
                onClick={renderVideo}
                loading={processing}
                icon={<Video className="w-4 h-4" />}
                className="w-full"
              >
                {isTestMode ? 'Simular Renderização' : 'Iniciar Renderização'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Next Phase Model Configuration */}
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
                  Próxima Etapa: Entrega
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

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onNext} icon={<Check className="w-4 h-4" />}>
          Continuar para Entrega
        </Button>
      </div>
    </motion.div>
  )
}
