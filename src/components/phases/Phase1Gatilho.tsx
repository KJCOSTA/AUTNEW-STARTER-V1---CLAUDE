import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Link2,
  FileText,
  Youtube,
  Eye,
  ThumbsUp,
  MessageCircle,
  Calendar,
  Clock,
  Tag,
  ExternalLink,
  User,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  ClipboardPaste,
  CheckCircle,
  Lightbulb,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui'
import { fetchYouTubeMetadata } from '../../services/api'
import type { ContentType, DurationType, EmotionalTrigger, ConcorrenteData } from '../../types'

const contentTypeOptions = [
  { value: 'oracao-guiada', label: 'Oração Guiada' },
  { value: 'meditacao-espiritual', label: 'Meditação Espiritual' },
  { value: 'reflexao-biblica', label: 'Reflexão Bíblica' },
  { value: 'salmo-narrado', label: 'Salmo Narrado' },
  { value: 'mensagem-fe', label: 'Mensagem de Fé' },
]

const durationOptions = [
  { value: '3-5min', label: '3-5 minutos' },
  { value: '5-10min', label: '5-10 minutos' },
  { value: '10-15min', label: '10-15 minutos' },
  { value: '15+min', label: '15+ minutos' },
]

const emotionalTriggers: { value: EmotionalTrigger; label: string }[] = [
  { value: 'esperanca', label: 'Esperança' },
  { value: 'cura', label: 'Cura' },
  { value: 'protecao', label: 'Proteção' },
  { value: 'gratidao', label: 'Gratidão' },
  { value: 'paz-interior', label: 'Paz Interior' },
  { value: 'forca', label: 'Força' },
  { value: 'perdao', label: 'Perdão' },
  { value: 'prosperidade', label: 'Prosperidade' },
  { value: 'sabedoria', label: 'Sabedoria' },
]

interface Phase1GatilhoProps {
  onNext: () => void
}

export function Phase1Gatilho({ onNext }: Phase1GatilhoProps) {
  const { gatilho, setGatilho, addToast, canal, setCanal, configuracoes } = useStore()
  const [extractingId, setExtractingId] = useState<string | null>(null)
  const [expandedConcorrente, setExpandedConcorrente] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State for channel data input methods
  const [pastedMetrics, setPastedMetrics] = useState('')
  const [processingPaste, setProcessingPaste] = useState(false)
  const [processingFile, setProcessingFile] = useState(false)

  const isTestMode = configuracoes.appMode === 'test'

  // Handle CSV/XLS file upload for CHANNEL data (not competitor)
  const handleChannelFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validTypes = ['.csv', '.xls', '.xlsx']
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validTypes.includes(fileExt)) {
      addToast({ type: 'error', message: 'Formato inválido. Use CSV ou XLS/XLSX.' })
      return
    }

    setProcessingFile(true)
    addToast({ type: 'info', message: `Processando ${file.name}...` })

    // In real implementation, parse the file and extract channel metrics
    // For now, simulate processing and add mock data
    setTimeout(() => {
      setCanal({
        conectado: true,
        nome: 'Mundo da Prece',
        inscritos: 125000,
        metricas30dias: {
          melhorVideo: 'Oração da Manhã',
          retencaoMedia: 42,
          duracaoPerforma: '8-12min',
          totalViews: 450000,
        },
      })
      setProcessingFile(false)
      addToast({ type: 'success', message: `Dados importados de ${file.name}!` })
    }, 1500)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle pasted metrics from YouTube Studio
  const handleProcessPastedMetrics = () => {
    if (!pastedMetrics.trim()) {
      addToast({ type: 'warning', message: 'Cole os dados do YouTube Studio primeiro' })
      return
    }

    setProcessingPaste(true)
    addToast({ type: 'info', message: 'Interpretando dados colados...' })

    // In real implementation, use AI to parse the pasted text
    // For now, simulate processing
    setTimeout(() => {
      setCanal({
        conectado: true,
        nome: 'Mundo da Prece',
        inscritos: 125000,
        metricas30dias: {
          melhorVideo: 'Oração da Manhã',
          retencaoMedia: 42,
          duracaoPerforma: '8-12min',
          totalViews: 450000,
        },
      })
      setProcessingPaste(false)
      addToast({ type: 'success', message: 'Dados interpretados com sucesso!' })
    }, 2000)
  }

  // Handle YouTube API connection
  const handleConnectYouTube = () => {
    addToast({ type: 'info', message: 'Conectando ao YouTube...' })

    // In real implementation, initiate OAuth flow
    setTimeout(() => {
      setCanal({
        conectado: true,
        nome: 'Mundo da Prece',
        inscritos: 125000,
        metricas30dias: {
          melhorVideo: 'Oração da Manhã',
          retencaoMedia: 42,
          duracaoPerforma: '8-12min',
          totalViews: 450000,
        },
      })
      addToast({ type: 'success', message: 'YouTube conectado com sucesso!' })
    }, 1500)
  }

  const handleTriggerToggle = (trigger: EmotionalTrigger) => {
    const current = gatilho.gatilhosEmocionais
    if (current.includes(trigger)) {
      setGatilho({
        gatilhosEmocionais: current.filter((t) => t !== trigger),
      })
    } else {
      setGatilho({
        gatilhosEmocionais: [...current, trigger],
      })
    }
  }

  // Add new competitor
  const addConcorrente = () => {
    const newConcorrente: ConcorrenteData = {
      id: Date.now().toString(),
      link: '',
      transcricao: '',
      metadados: null,
    }
    setGatilho({
      concorrentes: [...gatilho.concorrentes, newConcorrente],
    })
    setExpandedConcorrente(newConcorrente.id)
  }

  // Remove competitor
  const removeConcorrente = (id: string) => {
    setGatilho({
      concorrentes: gatilho.concorrentes.filter((c) => c.id !== id),
    })
  }

  // Update competitor field
  const updateConcorrente = (id: string, data: Partial<ConcorrenteData>) => {
    setGatilho({
      concorrentes: gatilho.concorrentes.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    })
  }

  // Extract metadata for a competitor
  const extractMetadata = async (concorrente: ConcorrenteData) => {
    if (!concorrente.link) {
      addToast({ type: 'warning', message: 'Cole o link do vídeo primeiro' })
      return
    }

    setExtractingId(concorrente.id)
    try {
      const data = await fetchYouTubeMetadata(concorrente.link)
      updateConcorrente(concorrente.id, { metadados: data })
      addToast({
        type: 'success',
        message: isTestMode
          ? '[TEST] Metadados simulados extraídos!'
          : 'Metadados extraídos com sucesso!'
      })
    } catch {
      addToast({
        type: 'error',
        message: 'Erro ao extrair metadados. Verifique o link.',
      })
    } finally {
      setExtractingId(null)
    }
  }

  // Validation - now allows partial filling
  const canProceed =
    gatilho.tema.trim() !== '' ||
    gatilho.concorrentes.some(c => c.link || c.transcricao)

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Section 1: Video Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Dados do Vídeo</CardTitle>
              <CardDescription>
                Defina o tema e características do vídeo que será criado
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Textarea
            label="Tema ou Intenção do Vídeo"
            placeholder="Ex: Oração poderosa para vencer a ansiedade e dormir em paz"
            value={gatilho.tema}
            onChange={(e) => setGatilho({ tema: e.target.value })}
            rows={3}
            hint="Descreva o objetivo do vídeo OU cole um link de referência abaixo"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Conteúdo"
              options={contentTypeOptions}
              value={gatilho.tipoConteudo}
              onChange={(e) =>
                setGatilho({ tipoConteudo: e.target.value as ContentType })
              }
            />
            <Select
              label="Duração Desejada"
              options={durationOptions}
              value={gatilho.duracao}
              onChange={(e) =>
                setGatilho({ duracao: e.target.value as DurationType })
              }
            />
          </div>

          {/* Emotional Triggers - Checkboxes */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-primary">
              Gatilhos Emocionais{' '}
              <span className="text-text-secondary">(opcional)</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {emotionalTriggers.map((trigger) => (
                <Checkbox
                  key={trigger.value}
                  label={trigger.label}
                  checked={gatilho.gatilhosEmocionais.includes(trigger.value)}
                  onChange={() => handleTriggerToggle(trigger.value)}
                />
              ))}
            </div>
          </div>

          <Textarea
            label="Observações Especiais (opcional)"
            placeholder="Ex: Mencionar o Salmo 23, focar em pessoas que perderam entes queridos"
            value={gatilho.observacoesEspeciais}
            onChange={(e) => setGatilho({ observacoesEspeciais: e.target.value })}
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Section 2: Competitor Analysis - Multiple */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                <Youtube className="w-5 h-5 text-accent-purple" />
              </div>
              <div>
                <CardTitle>Análise de Concorrentes</CardTitle>
                <CardDescription>
                  Adicione links de vídeos de referência que performaram bem
                </CardDescription>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={addConcorrente}
              icon={<Plus className="w-4 h-4" />}
            >
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {gatilho.concorrentes.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl">
              <Youtube className="w-12 h-12 mx-auto mb-3 text-text-secondary/50" />
              <p className="text-text-secondary mb-3">
                Nenhum concorrente adicionado ainda
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={addConcorrente}
                icon={<Plus className="w-4 h-4" />}
              >
                Adicionar Vídeo de Referência
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {gatilho.concorrentes.map((concorrente, index) => (
                <motion.div
                  key={concorrente.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-white/10 rounded-xl overflow-hidden"
                >
                  {/* Concorrente Header */}
                  <div
                    className="flex items-center justify-between p-4 bg-white/5 cursor-pointer"
                    onClick={() =>
                      setExpandedConcorrente(
                        expandedConcorrente === concorrente.id ? null : concorrente.id
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent-purple/20 text-accent-purple text-xs flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm text-text-primary">
                        {concorrente.metadados?.titulo ||
                          concorrente.link ||
                          'Novo Concorrente'}
                      </span>
                      {concorrente.metadados && (
                        <span className="px-2 py-0.5 bg-status-success/20 text-status-success text-xs rounded-full">
                          Extraído
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeConcorrente(concorrente.id)
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-status-error transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedConcorrente === concorrente.id ? (
                        <ChevronUp className="w-4 h-4 text-text-secondary" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-text-secondary" />
                      )}
                    </div>
                  </div>

                  {/* Concorrente Content */}
                  <AnimatePresence>
                    {expandedConcorrente === concorrente.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-4 border-t border-white/5">
                          {/* Link Input */}
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <Input
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={concorrente.link}
                                onChange={(e) =>
                                  updateConcorrente(concorrente.id, {
                                    link: e.target.value,
                                  })
                                }
                                className="h-11"
                              />
                            </div>
                            <Button
                              onClick={() => extractMetadata(concorrente)}
                              loading={extractingId === concorrente.id}
                              disabled={!concorrente.link}
                              icon={<Link2 className="w-4 h-4" />}
                            >
                              Extrair
                            </Button>
                          </div>

                          {/* Extracted Metadata Display */}
                          {concorrente.metadados && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="bg-background/50 rounded-xl p-4 space-y-4"
                            >
                              <div className="flex gap-4">
                                {concorrente.metadados.thumbnailUrl && (
                                  <img
                                    src={concorrente.metadados.thumbnailUrl}
                                    alt="Thumbnail"
                                    className="w-40 h-24 object-cover rounded-lg"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-text-primary truncate">
                                    {concorrente.metadados.titulo}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
                                    <User className="w-3 h-3" />
                                    <span>{concorrente.metadados.canal}</span>
                                    <span className="text-text-secondary/50">•</span>
                                    <span>
                                      {concorrente.metadados.inscritos} inscritos
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-4 mt-3">
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <Eye className="w-4 h-4 text-accent-blue" />
                                      <span className="text-text-primary">
                                        {formatNumber(concorrente.metadados.views)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <ThumbsUp className="w-4 h-4 text-status-success" />
                                      <span className="text-text-primary">
                                        {formatNumber(concorrente.metadados.likes)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <MessageCircle className="w-4 h-4 text-accent-purple" />
                                      <span className="text-text-primary">
                                        {formatNumber(
                                          concorrente.metadados.comentarios
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <Calendar className="w-4 h-4 text-status-warning" />
                                      <span className="text-text-secondary">
                                        {concorrente.metadados.diasDecorridos} dias
                                        atrás
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <Clock className="w-4 h-4 text-text-secondary" />
                                      <span className="text-text-secondary">
                                        {concorrente.metadados.duracao}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Tags */}
                              {concorrente.metadados.tags.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                                    <Tag className="w-4 h-4" />
                                    <span>Tags</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {concorrente.metadados.tags
                                      .slice(0, 10)
                                      .map((tag, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-1 bg-white/5 rounded-lg text-xs text-text-secondary"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    {concorrente.metadados.tags.length > 10 && (
                                      <span className="px-2 py-1 text-xs text-text-secondary">
                                        +{concorrente.metadados.tags.length - 10}{' '}
                                        mais
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Description */}
                              <details className="group">
                                <summary className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary">
                                  <FileText className="w-4 h-4" />
                                  <span>Ver descrição completa</span>
                                  <ExternalLink className="w-3 h-3 ml-auto group-open:rotate-90 transition-transform" />
                                </summary>
                                <p className="mt-2 text-sm text-text-secondary whitespace-pre-line max-h-40 overflow-y-auto">
                                  {concorrente.metadados.descricao}
                                </p>
                              </details>
                            </motion.div>
                          )}

                          {/* Transcription Field */}
                          <Textarea
                            label="Transcrição do Vídeo (opcional)"
                            placeholder="Cole aqui a transcrição do vídeo concorrente. Você pode obter através do botão 'Mostrar transcrição' do YouTube."
                            value={concorrente.transcricao}
                            onChange={(e) =>
                              updateConcorrente(concorrente.id, {
                                transcricao: e.target.value,
                              })
                            }
                            rows={4}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Channel Data - 3 Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-status-success/20 flex items-center justify-center">
              <User className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <CardTitle>Dados do Seu Canal</CardTitle>
              <CardDescription>
                Métricas para personalização baseada em performance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {canal.conectado ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl">
                <div>
                  <p className="font-medium text-text-primary">{canal.nome}</p>
                  <p className="text-sm text-text-secondary">
                    {formatNumber(canal.inscritos)} inscritos
                  </p>
                </div>
                <div className="w-3 h-3 rounded-full bg-status-success animate-pulse" />
              </div>
              {canal.metricas30dias && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-background/50 rounded-xl">
                    <p className="text-xs text-text-secondary">Melhor Vídeo</p>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {canal.metricas30dias.melhorVideo}
                    </p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-xl">
                    <p className="text-xs text-text-secondary">Retenção Média</p>
                    <p className="text-sm font-medium text-text-primary">
                      {canal.metricas30dias.retencaoMedia}%
                    </p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-xl">
                    <p className="text-xs text-text-secondary">Duração Ideal</p>
                    <p className="text-sm font-medium text-text-primary">
                      {canal.metricas30dias.duracaoPerforma}
                    </p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-xl">
                    <p className="text-xs text-text-secondary">Views (30d)</p>
                    <p className="text-sm font-medium text-text-primary">
                      {formatNumber(canal.metricas30dias.totalViews)}
                    </p>
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCanal({ conectado: false, nome: '', inscritos: 0, metricas30dias: null })}
              >
                Desconectar
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 3 Options as cards/tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Option A: Connect YouTube API */}
                <button
                  onClick={handleConnectYouTube}
                  className="flex flex-col items-center gap-2 p-4 border border-white/10 rounded-xl hover:bg-white/5 hover:border-accent-blue/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <Youtube className="w-6 h-6 text-red-500" />
                  </div>
                  <span className="text-sm font-medium text-text-primary">Conectar YouTube</span>
                  <span className="text-xs text-text-secondary text-center">Dados em tempo real</span>
                  <span className="px-2 py-0.5 text-[10px] bg-status-success/20 text-status-success rounded-full">
                    Recomendado
                  </span>
                </button>

                {/* Option B: Paste Metrics */}
                <button
                  onClick={() => {
                    const textarea = document.getElementById('paste-metrics-area')
                    textarea?.focus()
                  }}
                  className="flex flex-col items-center gap-2 p-4 border border-white/10 rounded-xl hover:bg-white/5 hover:border-accent-purple/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-accent-purple/10 flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors">
                    <ClipboardPaste className="w-6 h-6 text-accent-purple" />
                  </div>
                  <span className="text-sm font-medium text-text-primary">Colar Métricas</span>
                  <span className="text-xs text-text-secondary text-center">Do YouTube Studio</span>
                </button>

                {/* Option C: Import File */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-4 border border-white/10 rounded-xl hover:bg-white/5 hover:border-accent-blue/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-accent-blue/10 flex items-center justify-center group-hover:bg-accent-blue/20 transition-colors">
                    <FileSpreadsheet className="w-6 h-6 text-accent-blue" />
                  </div>
                  <span className="text-sm font-medium text-text-primary">Importar Arquivo</span>
                  <span className="text-xs text-text-secondary text-center">CSV ou Excel</span>
                </button>
              </div>

              {/* Hidden file input for Option C */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleChannelFileUpload}
                className="hidden"
              />

              {/* Paste Area for Option B */}
              <div className="space-y-3">
                <Textarea
                  id="paste-metrics-area"
                  label="Cole aqui os dados do YouTube Studio"
                  placeholder={`Vá em YouTube Studio > Analytics, selecione tudo (Ctrl+A) e cole aqui (Ctrl+V)

Exemplo de dados aceitos:
- Resumo de métricas
- Tabela de vídeos recentes
- Dados de retenção
- Estatísticas do canal

A IA vai interpretar automaticamente!`}
                  value={pastedMetrics}
                  onChange={(e) => setPastedMetrics(e.target.value)}
                  rows={6}
                />
                {pastedMetrics && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      {pastedMetrics.length} caracteres colados
                    </span>
                    <Button
                      size="sm"
                      onClick={handleProcessPastedMetrics}
                      loading={processingPaste}
                      icon={<CheckCircle className="w-4 h-4" />}
                    >
                      Processar Dados
                    </Button>
                  </div>
                )}
              </div>

              {/* Tip */}
              <div className="flex items-start gap-3 p-3 bg-accent-blue/5 border border-accent-blue/10 rounded-xl">
                <Lightbulb className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-text-primary font-medium">Dica</p>
                  <p className="text-xs text-text-secondary">
                    Use quantas opções quiser para uma análise mais completa.
                    A opção de colar é a mais prática se você não quer configurar OAuth.
                  </p>
                </div>
              </div>

              {processingFile && (
                <div className="flex items-center justify-center gap-2 p-4 bg-white/5 rounded-xl">
                  <div className="w-4 h-4 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-text-secondary">Processando arquivo...</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={onNext}
          disabled={!canProceed}
          icon={<Zap className="w-5 h-5" />}
        >
          Iniciar Processamento
        </Button>
      </div>
    </motion.div>
  )
}
