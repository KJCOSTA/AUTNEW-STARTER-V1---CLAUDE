import { useState } from 'react'
import { motion } from 'framer-motion'
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
import type { ContentType, DurationType, EmotionalTrigger } from '../../types'

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
  const { gatilho, setGatilho, addToast, canal } = useStore()
  const [extracting, setExtracting] = useState(false)

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

  const extractMetadata = async () => {
    if (!gatilho.concorrenteLink) {
      addToast({ type: 'warning', message: 'Cole o link do vídeo primeiro' })
      return
    }

    setExtracting(true)
    try {
      const response = await fetch('/api/youtube/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: gatilho.concorrenteLink }),
      })

      if (!response.ok) throw new Error('Erro ao extrair metadados')

      const data = await response.json()
      setGatilho({ concorrenteMetadados: data })
      addToast({ type: 'success', message: 'Metadados extraídos com sucesso!' })
    } catch {
      addToast({
        type: 'error',
        message: 'Erro ao extrair metadados. Verifique o link.',
      })
    } finally {
      setExtracting(false)
    }
  }

  const canProceed =
    gatilho.tema.trim() !== '' &&
    gatilho.gatilhosEmocionais.length > 0

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
            hint="Descreva claramente o objetivo e mensagem principal do vídeo"
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
              <span className="text-text-secondary">(selecione um ou mais)</span>
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

      {/* Section 2: Competitor Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
              <Youtube className="w-5 h-5 text-accent-purple" />
            </div>
            <div>
              <CardTitle>Análise de Concorrente</CardTitle>
              <CardDescription>
                Cole o link de um vídeo de referência que performou bem
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={gatilho.concorrenteLink}
                onChange={(e) => setGatilho({ concorrenteLink: e.target.value })}
                className="h-11"
              />
            </div>
            <Button
              onClick={extractMetadata}
              loading={extracting}
              disabled={!gatilho.concorrenteLink}
              icon={<Link2 className="w-4 h-4" />}
            >
              Extrair Metadados
            </Button>
          </div>

          {/* Extracted Metadata Display */}
          {gatilho.concorrenteMetadados && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-background/50 rounded-xl p-4 space-y-4"
            >
              <div className="flex gap-4">
                {gatilho.concorrenteMetadados.thumbnailUrl && (
                  <img
                    src={gatilho.concorrenteMetadados.thumbnailUrl}
                    alt="Thumbnail"
                    className="w-40 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-text-primary truncate">
                    {gatilho.concorrenteMetadados.titulo}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
                    <User className="w-3 h-3" />
                    <span>{gatilho.concorrenteMetadados.canal}</span>
                    <span className="text-text-secondary/50">•</span>
                    <span>{gatilho.concorrenteMetadados.inscritos} inscritos</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Eye className="w-4 h-4 text-accent-blue" />
                      <span className="text-text-primary">
                        {formatNumber(gatilho.concorrenteMetadados.views)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <ThumbsUp className="w-4 h-4 text-status-success" />
                      <span className="text-text-primary">
                        {formatNumber(gatilho.concorrenteMetadados.likes)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MessageCircle className="w-4 h-4 text-accent-purple" />
                      <span className="text-text-primary">
                        {formatNumber(gatilho.concorrenteMetadados.comentarios)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Calendar className="w-4 h-4 text-status-warning" />
                      <span className="text-text-secondary">
                        {gatilho.concorrenteMetadados.diasDecorridos} dias atrás
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="w-4 h-4 text-text-secondary" />
                      <span className="text-text-secondary">
                        {gatilho.concorrenteMetadados.duracao}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {gatilho.concorrenteMetadados.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Tag className="w-4 h-4" />
                    <span>Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {gatilho.concorrenteMetadados.tags.slice(0, 10).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-white/5 rounded-lg text-xs text-text-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                    {gatilho.concorrenteMetadados.tags.length > 10 && (
                      <span className="px-2 py-1 text-xs text-text-secondary">
                        +{gatilho.concorrenteMetadados.tags.length - 10} mais
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Description (collapsible) */}
              <details className="group">
                <summary className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary">
                  <FileText className="w-4 h-4" />
                  <span>Ver descrição completa</span>
                  <ExternalLink className="w-3 h-3 ml-auto group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-2 text-sm text-text-secondary whitespace-pre-line max-h-40 overflow-y-auto">
                  {gatilho.concorrenteMetadados.descricao}
                </p>
              </details>
            </motion.div>
          )}

          {/* Transcription Field */}
          <Textarea
            label="Transcrição do Vídeo (cole manualmente)"
            placeholder="Cole aqui a transcrição do vídeo concorrente. Você pode obter através do botão 'Mostrar transcrição' do YouTube ou usando extensões de navegador."
            value={gatilho.concorrenteTranscricao}
            onChange={(e) =>
              setGatilho({ concorrenteTranscricao: e.target.value })
            }
            rows={6}
            hint="A transcrição ajuda a IA a entender a estrutura narrativa do vídeo de sucesso"
          />
        </CardContent>
      </Card>

      {/* Section 3: Channel Data */}
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
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Youtube className="w-8 h-8 text-text-secondary" />
              </div>
              <p className="text-text-secondary mb-4">
                Conecte seu canal do YouTube para análises personalizadas
              </p>
              <Button variant="secondary" icon={<Youtube className="w-4 h-4" />}>
                Conectar YouTube
              </Button>
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
