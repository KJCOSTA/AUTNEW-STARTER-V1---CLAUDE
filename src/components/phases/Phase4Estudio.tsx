import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Film,
  Image,
  Volume2,
  Upload,
  RefreshCw,
  Clock,
  Check,
  Video,
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

interface Phase4EstudioProps {
  onNext: () => void
  onBack: () => void
}

export function Phase4Estudio({ onNext, onBack }: Phase4EstudioProps) {
  const { criacao, estudio, setEstudio, configuracoes, addToast } = useStore()
  const [processing, setProcessing] = useState(false)
  const [selectedCena, setSelectedCena] = useState<number | null>(null)
  const isMVP = configuracoes.modo === 'mvp'

  // Parse script into scenes
  useEffect(() => {
    if (estudio.cenas.length === 0 && criacao.roteiro) {
      parseScriptToScenes()
    }
  }, [criacao.roteiro])

  const parseScriptToScenes = () => {
    const script = criacao.roteiro
    const timestampRegex = /\[(\d{2}:\d{2})-(\d{2}:\d{2})\]\s*([^\n]+)\n([\s\S]*?)(?=\[\d{2}:\d{2}|\z)/g
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

    // If no timestamps found, split by paragraphs
    if (scenes.length === 0) {
      const paragraphs = script.split('\n\n').filter((p) => p.trim())
      const timePerParagraph = Math.ceil(420 / paragraphs.length) // Assuming 7min video

      paragraphs.forEach((paragraph, i) => {
        const startSeconds = i * timePerParagraph
        const endSeconds = Math.min((i + 1) * timePerParagraph, 420)
        const formatTime = (s: number) =>
          `${Math.floor(s / 60)
            .toString()
            .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

        scenes.push({
          id: i + 1,
          timestamp: `${formatTime(startSeconds)}-${formatTime(endSeconds)}`,
          texto: paragraph.trim(),
          visualSugerido: getVisualSuggestion('', paragraph),
          visualTipo: 'stock',
        })
      })
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
    if (lower.includes('final') || lower.includes('encerramento')) {
      return 'Céu azul com nuvens, raios de sol, esperança'
    }
    return 'Imagem serena espiritual, tons quentes e acolhedores'
  }

  const generateAudioForScene = async (sceneId: number) => {
    if (isMVP) {
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
    } catch {
      addToast({ type: 'error', message: 'Erro ao gerar áudio' })
    } finally {
      setProcessing(false)
    }
  }

  const handleVisualUpload = (sceneId: number) => {
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
    if (isMVP) {
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
        await new Promise((r) => setTimeout(r, 500))
      }

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
    } catch {
      addToast({ type: 'error', message: 'Erro na renderização' })
    } finally {
      setProcessing(false)
    }
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
              {isMVP
                ? 'Revise as cenas e exporte para montagem manual'
                : 'Configure as cenas para renderização automática'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                        Upload Visual
                      </Button>
                      {!isMVP && (
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
                          Gerar Áudio
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
                    {cena.audioUrl && (
                      <audio controls className="w-full mt-2">
                        <source src={cena.audioUrl} type="audio/mpeg" />
                      </audio>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MVP Checklist / Production Render */}
      {isMVP ? (
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
            <CardTitle>Renderização Automática</CardTitle>
            <CardDescription>
              O sistema irá combinar áudio, vídeo e trilha automaticamente
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
                    ? `Renderizando... ${estudio.progressoRenderizacao}%`
                    : 'Renderização concluída!'}
                </p>
              </div>
            ) : (
              <Button
                onClick={renderVideo}
                loading={processing}
                icon={<Video className="w-4 h-4" />}
                className="w-full"
              >
                Iniciar Renderização
              </Button>
            )}
          </CardContent>
        </Card>
      )}

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
