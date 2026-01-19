import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Film,
  Image,
  Volume2,
  Upload,
  Clock,
  Check,
  Video,
  ChevronDown,
  ChevronUp,
  Zap,
  Settings2,
  Search,
  Play,
  X,
  Loader2,
  DollarSign,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
} from '../ui'
import type { Cena, MediaOption } from '../../types'
import { searchAllFreeSources, COSTS } from '../../services/mediaSearch'
import { getBestVideoUrl } from '../../services/pexels'
import { getBestPixabayVideoUrl } from '../../services/pixabay'

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
      searchQuery: 'sunrise mountains golden light',
      visualTipo: 'stock',
      mediaSearchStatus: 'idle',
    },
    {
      id: 2,
      timestamp: '00:15-00:45',
      texto: 'GANCHO EMOCIONAL\n\nQuantas vezes você se sentiu perdido, sem saber para onde ir? Quantas noites passou acordado, com o coração pesado?',
      visualSugerido: 'Pessoa contemplativa olhando para o horizonte, silhueta ao pôr do sol',
      searchQuery: 'person silhouette sunset contemplation',
      visualTipo: 'stock',
      mediaSearchStatus: 'idle',
    },
    {
      id: 3,
      timestamp: '00:45-01:30',
      texto: 'CTA DE ABERTURA\n\nAntes de começarmos, se inscreva no canal e ative o sininho para não perder nenhuma oração.',
      visualSugerido: 'Animação suave do botão de inscrição com fundo espiritual',
      searchQuery: 'subscribe button animation spiritual',
      visualTipo: 'stock',
      mediaSearchStatus: 'idle',
    },
    {
      id: 4,
      timestamp: '01:30-05:00',
      texto: 'ORAÇÃO PRINCIPAL\n\nVamos orar juntos... Senhor, neste momento eu venho até Ti com o coração aberto...',
      visualSugerido: 'Mãos unidas em oração com luz divina, velas acesas ao fundo',
      searchQuery: 'hands praying divine light candles',
      visualTipo: 'stock',
      mediaSearchStatus: 'idle',
    },
    {
      id: 5,
      timestamp: '05:00-06:30',
      texto: 'CTA DO MEIO\n\nSe esta oração está tocando seu coração, deixe um Amém nos comentários e compartilhe com alguém que precisa.',
      visualSugerido: 'Coração brilhante com partículas de luz, atmosfera esperançosa',
      searchQuery: 'heart light particles hope',
      visualTipo: 'stock',
      mediaSearchStatus: 'idle',
    },
    {
      id: 6,
      timestamp: '06:30-FIM',
      texto: 'FECHAMENTO\n\nQue a paz do Senhor esteja com você hoje e sempre. Fique com Deus.',
      visualSugerido: 'Céu estrelado com luz divina descendo, sensação de paz',
      searchQuery: 'starry sky divine light peace',
      visualTipo: 'stock',
      mediaSearchStatus: 'idle',
    },
  ]
}

export function Phase4Estudio({ onNext, onBack }: Phase4EstudioProps) {
  const { criacao, estudio, setEstudio, configuracoes, addToast } = useStore()
  const [processing, setProcessing] = useState(false)
  const [selectedCena, setSelectedCena] = useState<number | null>(null)
  const [searchingCena, setSearchingCena] = useState<number | null>(null)
  const [previewVideo, setPreviewVideo] = useState<MediaOption | null>(null)
  const [showRenderSummary, setShowRenderSummary] = useState(false)

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
        searchQuery: generateSearchQuery(title, content),
        visualTipo: 'stock',
        mediaSearchStatus: 'idle',
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
          searchQuery: generateSearchQuery(title, content),
          visualTipo: 'stock',
          mediaSearchStatus: 'idle',
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

  const generateSearchQuery = (title: string, content: string): string => {
    const lower = (title + content).toLowerCase()
    if (lower.includes('abertura') || lower.includes('gancho')) {
      return 'elderly person reflection peaceful'
    }
    if (lower.includes('oração') || lower.includes('reza')) {
      return 'hands praying divine light'
    }
    if (lower.includes('silêncio') || lower.includes('meditação')) {
      return 'peaceful nature sunset meditation'
    }
    if (lower.includes('bíblia') || lower.includes('escritura')) {
      return 'bible open light cozy'
    }
    if (lower.includes('final') || lower.includes('encerramento') || lower.includes('fechamento')) {
      return 'blue sky clouds sunrays hope'
    }
    return 'spiritual serene warm light'
  }

  // Search videos for a scene
  const searchVideosForScene = async (sceneId: number) => {
    const scene = estudio.cenas.find((c) => c.id === sceneId)
    if (!scene) return

    setSearchingCena(sceneId)

    // Update scene status
    const updatedCenas = estudio.cenas.map((c) =>
      c.id === sceneId ? { ...c, mediaSearchStatus: 'searching' as const } : c
    )
    setEstudio({ cenas: updatedCenas })

    try {
      if (isTestMode) {
        // Mock search results
        await new Promise(r => setTimeout(r, 1500))
        const mockOptions: MediaOption[] = [
          { id: '1', url: `https://picsum.photos/seed/${sceneId}a/1920/1080`, thumbnailUrl: `https://picsum.photos/seed/${sceneId}a/320/180`, source: 'pexels', type: 'video', duration: 15 },
          { id: '2', url: `https://picsum.photos/seed/${sceneId}b/1920/1080`, thumbnailUrl: `https://picsum.photos/seed/${sceneId}b/320/180`, source: 'pexels', type: 'video', duration: 22 },
          { id: '3', url: `https://picsum.photos/seed/${sceneId}c/1920/1080`, thumbnailUrl: `https://picsum.photos/seed/${sceneId}c/320/180`, source: 'pixabay', type: 'video', duration: 18 },
          { id: '4', url: `https://picsum.photos/seed/${sceneId}d/1920/1080`, thumbnailUrl: `https://picsum.photos/seed/${sceneId}d/320/180`, source: 'pixabay', type: 'video', duration: 30 },
          { id: '5', url: `https://picsum.photos/seed/${sceneId}e/1920/1080`, thumbnailUrl: `https://picsum.photos/seed/${sceneId}e/320/180`, source: 'unsplash', type: 'image' },
          { id: '6', url: `https://picsum.photos/seed/${sceneId}f/1920/1080`, thumbnailUrl: `https://picsum.photos/seed/${sceneId}f/320/180`, source: 'unsplash', type: 'image' },
        ]

        const finalCenas = estudio.cenas.map((c) =>
          c.id === sceneId
            ? { ...c, mediaOptions: mockOptions, mediaSearchStatus: 'found' as const }
            : c
        )
        setEstudio({ cenas: finalCenas })
        addToast({ type: 'success', message: `[TEST MODE] ${mockOptions.length} mídias encontradas` })
      } else {
        // Real API call
        const results = await searchAllFreeSources(scene.searchQuery || scene.visualSugerido)

        const mediaOptions: MediaOption[] = []

        // Add Pexels videos
        results.pexelsVideos.slice(0, 3).forEach((video) => {
          mediaOptions.push({
            id: `pexels-v-${video.id}`,
            url: getBestVideoUrl(video),
            thumbnailUrl: video.image,
            source: 'pexels',
            type: 'video',
            duration: video.duration,
            width: video.width,
            height: video.height,
          })
        })

        // Add Pixabay videos
        results.pixabayVideos.slice(0, 2).forEach((video) => {
          mediaOptions.push({
            id: `pixabay-v-${video.id}`,
            url: getBestPixabayVideoUrl(video),
            thumbnailUrl: `https://i.vimeocdn.com/video/${video.picture_id}_320x180.jpg`,
            source: 'pixabay',
            type: 'video',
            duration: video.duration,
            attribution: `Video by ${video.user} on Pixabay`,
          })
        })

        // Add Pexels photos
        results.pexelsPhotos.slice(0, 2).forEach((photo) => {
          mediaOptions.push({
            id: `pexels-p-${photo.id}`,
            url: photo.src.large2x,
            thumbnailUrl: photo.src.medium,
            source: 'pexels',
            type: 'image',
            attribution: `Photo by ${photo.photographer} on Pexels`,
          })
        })

        // Add Unsplash photos
        results.unsplashPhotos.slice(0, 2).forEach((photo) => {
          mediaOptions.push({
            id: `unsplash-${photo.id}`,
            url: photo.urls.regular,
            thumbnailUrl: photo.urls.small,
            source: 'unsplash',
            type: 'image',
            attribution: `Photo by ${photo.user.name} on Unsplash`,
          })
        })

        const finalCenas = estudio.cenas.map((c) =>
          c.id === sceneId
            ? {
                ...c,
                mediaOptions,
                mediaSearchStatus: mediaOptions.length > 0 ? 'found' as const : 'not-found' as const,
              }
            : c
        )
        setEstudio({ cenas: finalCenas })

        if (mediaOptions.length > 0) {
          addToast({ type: 'success', message: `${mediaOptions.length} mídias encontradas!` })
        } else {
          addToast({ type: 'warning', message: 'Nenhuma mídia encontrada. Tente outro termo.' })
        }
      }
    } catch (error) {
      const finalCenas = estudio.cenas.map((c) =>
        c.id === sceneId ? { ...c, mediaSearchStatus: 'not-found' as const } : c
      )
      setEstudio({ cenas: finalCenas })
      addToast({ type: 'error', message: 'Erro ao buscar mídias' })
    } finally {
      setSearchingCena(null)
    }
  }

  // Select a media for a scene
  const selectMediaForScene = (sceneId: number, media: MediaOption) => {
    const updatedCenas = estudio.cenas.map((c) =>
      c.id === sceneId
        ? {
            ...c,
            selectedMedia: media,
            visualUrl: media.url,
            visualTipo: 'stock' as const,
          }
        : c
    )
    setEstudio({ cenas: updatedCenas })
    addToast({ type: 'success', message: `Mídia selecionada para cena ${sceneId}` })
  }

  // Update search query for a scene
  const updateSearchQuery = (sceneId: number, query: string) => {
    const updatedCenas = estudio.cenas.map((c) =>
      c.id === sceneId ? { ...c, searchQuery: query } : c
    )
    setEstudio({ cenas: updatedCenas })
  }

  const generateAudioForScene = async (sceneId: number) => {
    if (isMVP && !isTestMode) {
      addToast({
        type: 'warning',
        message: 'Geração de áudio disponível apenas no Workflow Automático',
      })
      return
    }

    setProcessing(true)
    try {
      const scene = estudio.cenas.find((c) => c.id === sceneId)
      if (!scene) return

      if (isTestMode) {
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
      const mockMedia: MediaOption = {
        id: `upload-${Date.now()}`,
        url: `https://picsum.photos/seed/upload${Date.now()}/1920/1080`,
        thumbnailUrl: `https://picsum.photos/seed/upload${Date.now()}/320/180`,
        source: 'upload',
        type: 'image',
      }
      const updatedCenas = estudio.cenas.map((c) =>
        c.id === sceneId
          ? { ...c, selectedMedia: mockMedia, visualUrl: mockMedia.url, visualTipo: 'upload' as const }
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
        const mockMedia: MediaOption = {
          id: `upload-${Date.now()}`,
          url,
          thumbnailUrl: url,
          source: 'upload',
          type: file.type.startsWith('video') ? 'video' : 'image',
        }
        const updatedCenas = estudio.cenas.map((c) =>
          c.id === sceneId
            ? { ...c, selectedMedia: mockMedia, visualUrl: url, visualTipo: 'upload' as const }
            : c
        )
        setEstudio({ cenas: updatedCenas })
        addToast({ type: 'success', message: 'Mídia carregada!' })
      }
    }
    input.click()
  }

  // Calculate render summary
  const getRenderSummary = () => {
    const scenesWithMedia = estudio.cenas.filter((c) => c.selectedMedia || c.visualUrl)
    const pexelsCount = estudio.cenas.filter((c) => c.selectedMedia?.source === 'pexels').length
    const pixabayCount = estudio.cenas.filter((c) => c.selectedMedia?.source === 'pixabay').length
    const unsplashCount = estudio.cenas.filter((c) => c.selectedMedia?.source === 'unsplash').length
    const uploadCount = estudio.cenas.filter((c) => c.selectedMedia?.source === 'upload').length
    const imagesForKenBurns = estudio.cenas.filter((c) => c.selectedMedia?.type === 'image').length

    // Estimate duration (6 minutes average)
    const estimatedDuration = 6

    // Calculate costs
    const renderCost = estimatedDuration * COSTS.json2video

    return {
      totalScenes: estudio.cenas.length,
      scenesReady: scenesWithMedia.length,
      pexelsCount,
      pixabayCount,
      unsplashCount,
      uploadCount,
      imagesForKenBurns,
      estimatedDuration,
      renderCost: renderCost.toFixed(2),
      allReady: scenesWithMedia.length === estudio.cenas.length,
    }
  }

  const renderVideo = async () => {
    const summary = getRenderSummary()

    if (!summary.allReady && !isTestMode) {
      addToast({
        type: 'warning',
        message: 'Selecione vídeos para todas as cenas antes de renderizar',
      })
      return
    }

    if (isMVP && !isTestMode) {
      addToast({
        type: 'info',
        message: 'No modo MVP, use o checklist para montar no CapCut',
      })
      return
    }

    setShowRenderSummary(false)
    setProcessing(true)
    try {
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

  const summary = getRenderSummary()

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
                ? '[TEST MODE] Selecione vídeos para cada cena'
                : isMVP
                ? 'Revise as cenas e exporte para montagem manual'
                : 'Selecione vídeos gratuitos para cada cena'}
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
                : 'bg-accent-purple/20 text-accent-purple'
            }`}
          >
            {isMVP ? 'Workflow MVP' : 'Workflow Auto'}
          </span>
        </div>
      </div>

      {/* Scene Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-text-secondary">Total de Cenas</p>
          <p className="text-2xl font-bold text-text-primary">{summary.totalScenes}</p>
        </div>
        <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/20">
          <p className="text-xs text-status-success">Vídeos Selecionados</p>
          <p className="text-2xl font-bold text-status-success">{summary.scenesReady}</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-400">Aguardando</p>
          <p className="text-2xl font-bold text-amber-400">{summary.totalScenes - summary.scenesReady}</p>
        </div>
        <div className="p-3 rounded-xl bg-accent-blue/10 border border-accent-blue/20">
          <p className="text-xs text-accent-blue">Custo Estimado</p>
          <p className="text-2xl font-bold text-accent-blue">${isTestMode ? '0.00' : summary.renderCost}</p>
        </div>
      </div>

      {/* Scenes List with Video Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Cenas do Vídeo ({estudio.cenas.length})</CardTitle>
          <CardDescription>
            Para cada cena, busque e selecione um vídeo gratuito do Pexels ou Pixabay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {estudio.cenas.map((cena, index) => (
              <motion.div
                key={cena.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl border transition-all ${
                  cena.selectedMedia
                    ? 'border-status-success/50 bg-status-success/5'
                    : 'border-white/10 bg-background/50'
                }`}
              >
                {/* Scene Header */}
                <div
                  onClick={() => setSelectedCena(selectedCena === cena.id ? null : cena.id)}
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Scene Number & Status */}
                    <div className="flex flex-col items-center">
                      <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                        cena.selectedMedia
                          ? 'bg-status-success/20 text-status-success'
                          : 'bg-white/10 text-text-primary'
                      }`}>
                        {cena.selectedMedia ? <Check className="w-5 h-5" /> : cena.id}
                      </span>
                      <div className="flex items-center gap-1 mt-2 text-xs text-text-secondary">
                        <Clock className="w-3 h-3" />
                        {cena.timestamp}
                      </div>
                    </div>

                    {/* Visual Preview */}
                    <div className="w-24 h-16 rounded-lg bg-card flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/10">
                      {cena.selectedMedia?.thumbnailUrl || cena.visualUrl ? (
                        <img
                          src={cena.selectedMedia?.thumbnailUrl || cena.visualUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-6 h-6 text-text-secondary" />
                      )}
                    </div>

                    {/* Text Preview */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary line-clamp-1">
                        {cena.texto.split('\n')[0]}
                      </p>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                        {cena.visualSugerido}
                      </p>
                      {cena.selectedMedia && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            cena.selectedMedia.source === 'pexels' ? 'bg-green-500/20 text-green-400' :
                            cena.selectedMedia.source === 'pixabay' ? 'bg-blue-500/20 text-blue-400' :
                            cena.selectedMedia.source === 'unsplash' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-white/10 text-text-secondary'
                          }`}>
                            {cena.selectedMedia.source}
                          </span>
                          {cena.selectedMedia.type === 'video' && cena.selectedMedia.duration && (
                            <span className="text-xs text-text-secondary">
                              {cena.selectedMedia.duration}s
                            </span>
                          )}
                          <span className="text-xs text-status-success">Grátis</span>
                        </div>
                      )}
                    </div>

                    {/* Expand Icon */}
                    <ChevronDown className={`w-5 h-5 text-text-secondary transition-transform flex-shrink-0 ${
                      selectedCena === cena.id ? 'rotate-180' : ''
                    }`} />
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {selectedCena === cena.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
                        {/* Full Text */}
                        <div className="p-3 bg-background rounded-lg">
                          <p className="text-sm text-text-secondary whitespace-pre-line">
                            {cena.texto}
                          </p>
                        </div>

                        {/* Search Section */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-text-primary">
                            Buscar vídeo/imagem:
                          </label>
                          <div className="flex gap-2">
                            <Input
                              value={cena.searchQuery || ''}
                              onChange={(e) => updateSearchQuery(cena.id, e.target.value)}
                              placeholder="Ex: pessoa orando, nascer do sol..."
                              className="flex-1"
                            />
                            <Button
                              onClick={() => searchVideosForScene(cena.id)}
                              loading={searchingCena === cena.id}
                              icon={<Search className="w-4 h-4" />}
                            >
                              Buscar
                            </Button>
                          </div>
                        </div>

                        {/* Media Grid */}
                        {cena.mediaOptions && cena.mediaOptions.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-text-primary">
                              Selecione uma mídia ({cena.mediaOptions.length} encontradas):
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {cena.mediaOptions.map((media) => (
                                <div
                                  key={media.id}
                                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                    cena.selectedMedia?.id === media.id
                                      ? 'border-status-success ring-2 ring-status-success/50'
                                      : 'border-transparent hover:border-white/30'
                                  }`}
                                  onClick={() => selectMediaForScene(cena.id, media)}
                                >
                                  <img
                                    src={media.thumbnailUrl}
                                    alt=""
                                    className="w-full h-20 object-cover"
                                  />
                                  {/* Overlay with info */}
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setPreviewVideo(media)
                                      }}
                                      className="p-1.5 bg-white/20 rounded-full hover:bg-white/30"
                                    >
                                      <Play className="w-4 h-4 text-white" />
                                    </button>
                                    <span className="text-[10px] text-white">
                                      {media.duration ? `${media.duration}s` : 'Foto'}
                                    </span>
                                  </div>
                                  {/* Source badge */}
                                  <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] ${
                                    media.source === 'pexels' ? 'bg-green-500/80 text-white' :
                                    media.source === 'pixabay' ? 'bg-blue-500/80 text-white' :
                                    'bg-purple-500/80 text-white'
                                  }`}>
                                    {media.source}
                                  </div>
                                  {/* Selected check */}
                                  {cena.selectedMedia?.id === media.id && (
                                    <div className="absolute top-1 right-1 w-5 h-5 bg-status-success rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No results */}
                        {cena.mediaSearchStatus === 'not-found' && (
                          <div className="p-4 bg-status-warning/10 rounded-lg text-center">
                            <AlertTriangle className="w-8 h-8 text-status-warning mx-auto mb-2" />
                            <p className="text-sm text-status-warning">
                              Nenhuma mídia encontrada. Tente outro termo de busca.
                            </p>
                          </div>
                        )}

                        {/* Loading */}
                        {cena.mediaSearchStatus === 'searching' && (
                          <div className="p-4 bg-white/5 rounded-lg text-center">
                            <Loader2 className="w-8 h-8 text-accent-blue mx-auto mb-2 animate-spin" />
                            <p className="text-sm text-text-secondary">
                              Buscando vídeos gratuitos...
                            </p>
                          </div>
                        )}

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
                            {isTestMode ? 'Simular Upload' : 'Upload Manual'}
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                onClick={() => setShowRenderSummary(true)}
                disabled={!summary.allReady && !isTestMode}
                icon={<Video className="w-4 h-4" />}
                className="w-full"
              >
                {summary.allReady || isTestMode
                  ? (isTestMode ? 'Simular Renderização' : 'Iniciar Renderização')
                  : `Selecione vídeos (${summary.scenesReady}/${summary.totalScenes})`}
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

      {/* Video Preview Modal */}
      <AnimatePresence>
        {previewVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-4 w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-text-primary">Preview de Mídia</h3>
                  <p className="text-xs text-text-secondary">
                    {previewVideo.source} • {previewVideo.type === 'video' ? `${previewVideo.duration}s` : 'Imagem'}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewVideo(null)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {previewVideo.type === 'video' ? (
                  <video
                    src={previewVideo.url}
                    controls
                    autoPlay
                    muted
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={previewVideo.url}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              {previewVideo.attribution && (
                <p className="text-xs text-text-secondary mt-2 text-center">
                  {previewVideo.attribution}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render Summary Modal */}
      <AnimatePresence>
        {showRenderSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRenderSummary(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Resumo da Montagem</h2>
                  <p className="text-sm text-text-secondary">Confirme antes de renderizar</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-text-secondary">Total de Cenas</span>
                  <span className="font-medium text-text-primary">{summary.totalScenes}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-text-secondary">Vídeos do Pexels</span>
                  <span className="font-medium text-status-success">{summary.pexelsCount} (Grátis)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-text-secondary">Vídeos do Pixabay</span>
                  <span className="font-medium text-status-success">{summary.pixabayCount} (Grátis)</span>
                </div>
                {summary.unsplashCount > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-text-secondary">Fotos do Unsplash</span>
                    <span className="font-medium text-status-success">{summary.unsplashCount} (Grátis)</span>
                  </div>
                )}
                {summary.imagesForKenBurns > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-text-secondary">Imagens com Ken Burns</span>
                    <span className="font-medium text-text-primary">{summary.imagesForKenBurns}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-text-secondary">Narração</span>
                  <span className="font-medium text-status-success">Edge TTS (Grátis)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-text-secondary">Duração Estimada</span>
                  <span className="font-medium text-text-primary">{summary.estimatedDuration}:00 min</span>
                </div>
                <div className="flex justify-between py-3 bg-accent-blue/10 rounded-lg px-3">
                  <span className="font-medium text-accent-blue flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Custo de Renderização
                  </span>
                  <span className="font-bold text-accent-blue">
                    {isTestMode ? '$0.00' : `$${summary.renderCost}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowRenderSummary(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={renderVideo}
                  loading={processing}
                  icon={<Zap className="w-4 h-4" />}
                >
                  {isTestMode ? 'Simular Renderização' : 'Renderizar Vídeo'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
