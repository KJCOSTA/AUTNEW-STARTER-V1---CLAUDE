import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Eye,
  Edit3,
  CheckCircle,
  Zap,
  Youtube,
  User,
  Clock,
  ThumbsUp,
  Lightbulb,
  ArrowLeft,
  Play,
  AlertTriangle,
  RefreshCw,
  BookOpen,
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
import type { EmotionalTrigger } from '../../types'

const contentTypeLabels: Record<string, string> = {
  'oracao-guiada': 'Oração Guiada',
  'meditacao-espiritual': 'Meditação Espiritual',
  'reflexao-biblica': 'Reflexão Bíblica',
  'salmo-narrado': 'Salmo Narrado',
  'mensagem-fe': 'Mensagem de Fé',
}

const durationLabels: Record<string, string> = {
  '3-5min': '3-5 minutos',
  '5-10min': '5-10 minutos',
  '10-15min': '10-15 minutos',
  '15+min': '15+ minutos',
}

const emotionalTriggerLabels: Record<EmotionalTrigger, string> = {
  esperanca: 'Esperança',
  cura: 'Cura',
  protecao: 'Proteção',
  gratidao: 'Gratidão',
  'paz-interior': 'Paz Interior',
  forca: 'Força',
  perdao: 'Perdão',
  prosperidade: 'Prosperidade',
  sabedoria: 'Sabedoria',
}

interface PhasePlanejamentoProps {
  onNext: () => void
  onBack: () => void
}

export function PhasePlanejamento({ onNext, onBack }: PhasePlanejamentoProps) {
  const {
    gatilho,
    canal,
    planejamento,
    setPlanejamento,
    diretrizes,
    addToast,
  } = useStore()

  const [isEditing, setIsEditing] = useState(false)

  // Generate research plan on mount
  useEffect(() => {
    if (!planejamento.planoPesquisa) {
      const generatedPlan = generateResearchPlan()
      setPlanejamento({
        planoPesquisa: generatedPlan,
        planoOriginal: generatedPlan,
      })
    }
  }, [])

  // Generate research plan based on collected data
  const generateResearchPlan = () => {
    const lines: string[] = []

    lines.push('=== PLANO DE PESQUISA PARA INTELIGÊNCIA ===\n')

    // Section 1: Theme Research
    if (gatilho.tema) {
      lines.push('## 1. PESQUISA DO TEMA')
      lines.push(`- Tema principal: "${gatilho.tema}"`)
      lines.push(`- Tipo de conteúdo: ${contentTypeLabels[gatilho.tipoConteudo] || gatilho.tipoConteudo}`)
      lines.push(`- Duração alvo: ${durationLabels[gatilho.duracao] || gatilho.duracao}`)
      lines.push('')
      lines.push('Pesquisar:')
      lines.push('  - Versículos bíblicos relacionados ao tema')
      lines.push('  - Salmos apropriados para o contexto')
      lines.push('  - Frases de santos e teólogos sobre o assunto')
      lines.push('  - Curiosidades e fatos relevantes')
      lines.push('')
    }

    // Section 2: Emotional Triggers
    if (gatilho.gatilhosEmocionais.length > 0) {
      lines.push('## 2. GATILHOS EMOCIONAIS')
      lines.push('Otimizar conteúdo para os seguintes gatilhos:')
      gatilho.gatilhosEmocionais.forEach((trigger) => {
        lines.push(`  - ${emotionalTriggerLabels[trigger] || trigger}`)
      })
      lines.push('')
      lines.push('Pesquisar:')
      lines.push('  - Palavras-chave que ativam esses sentimentos')
      lines.push('  - Estruturas narrativas que geram conexão emocional')
      lines.push('  - Hooks de retenção associados')
      lines.push('')
    }

    // Section 3: Competitor Analysis
    const competitorsWithData = gatilho.concorrentes.filter((c) => c.metadados)
    if (competitorsWithData.length > 0) {
      lines.push('## 3. ANÁLISE DE CONCORRENTES')
      lines.push(`Analisar ${competitorsWithData.length} vídeo(s) de referência:`)
      competitorsWithData.forEach((c, i) => {
        if (c.metadados) {
          lines.push(`\n  ${i + 1}. "${c.metadados.titulo}"`)
          lines.push(`     Canal: ${c.metadados.canal}`)
          lines.push(`     Views: ${formatNumber(c.metadados.views)} | Likes: ${formatNumber(c.metadados.likes)}`)
          lines.push(`     Duração: ${c.metadados.duracao}`)
        }
      })
      lines.push('')
      lines.push('Extrair:')
      lines.push('  - Estrutura narrativa (abertura, desenvolvimento, fechamento)')
      lines.push('  - Ganchos de retenção usados')
      lines.push('  - Elementos que geraram engajamento')
      lines.push('  - Palavras-chave do título e descrição')
      lines.push('')
    }

    // Section 4: Transcriptions
    const competitorsWithTranscription = gatilho.concorrentes.filter((c) => c.transcricao)
    if (competitorsWithTranscription.length > 0) {
      lines.push('## 4. ANÁLISE DE TRANSCRIÇÕES')
      lines.push(`${competitorsWithTranscription.length} transcrição(ões) disponível(is) para análise`)
      lines.push('')
      lines.push('Extrair:')
      lines.push('  - Tom e estilo de comunicação')
      lines.push('  - Estrutura do roteiro')
      lines.push('  - CTAs utilizados e posicionamento')
      lines.push('  - Tempo médio de cada seção')
      lines.push('')
    }

    // Section 5: Channel Optimization
    if (canal.conectado && canal.metricas30dias) {
      lines.push('## 5. OTIMIZAÇÃO PARA O CANAL')
      lines.push(`Canal: ${canal.nome}`)
      lines.push(`Inscritos: ${formatNumber(canal.inscritos)}`)
      lines.push(`Retenção média: ${canal.metricas30dias.retencaoMedia}%`)
      lines.push(`Duração que performa: ${canal.metricas30dias.duracaoPerforma}`)
      lines.push('')
      lines.push('Aplicar:')
      lines.push('  - Padrões de sucesso identificados no canal')
      lines.push('  - Ajustar duração para performance ideal')
      lines.push('  - Incorporar elementos dos vídeos de melhor retenção')
      lines.push('')
    }

    // Section 6: Guidelines
    lines.push('## 6. DIRETRIZES A APLICAR')

    if (diretrizes.secoesAtivas?.listaNegra !== false && diretrizes.listaNegra.length > 0) {
      lines.push(`- Lista negra: Evitar ${diretrizes.listaNegra.length} palavra(s) proibida(s)`)
    }

    if (diretrizes.secoesAtivas?.ctasObrigatorios !== false) {
      lines.push('- CTAs obrigatórios: Abertura + E-book + Grupo VIP')
    }

    if (diretrizes.secoesAtivas?.arquiteturaRoteiro !== false) {
      lines.push('- Arquitetura do roteiro: Seguir estrutura padrão do canal')
    }

    const customAtivas = diretrizes.diretrizesCustomizadas?.filter((d) => d.ativa) || []
    if (customAtivas.length > 0) {
      lines.push(`- ${customAtivas.length} diretriz(es) personalizada(s) ativa(s)`)
    }

    // Section 7: Special Notes
    if (gatilho.observacoesEspeciais) {
      lines.push('')
      lines.push('## 7. OBSERVAÇÕES ESPECIAIS')
      lines.push(gatilho.observacoesEspeciais)
    }

    lines.push('')
    lines.push('---')
    lines.push('NOTA: Edite este plano conforme necessário antes de aprovar.')

    return lines.join('\n')
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const handleRegenerate = () => {
    const generatedPlan = generateResearchPlan()
    setPlanejamento({
      planoPesquisa: generatedPlan,
      planoOriginal: generatedPlan,
    })
    setIsEditing(false)
    addToast({ type: 'info', message: 'Plano regenerado' })
  }

  const handleApprove = () => {
    setPlanejamento({
      aprovado: true,
      aprovadoEm: new Date().toISOString(),
    })
    addToast({ type: 'success', message: 'Plano aprovado! Iniciando fase de Inteligência...' })
    onNext()
  }

  const hasModifications = planejamento.planoPesquisa !== planejamento.planoOriginal

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <Card className="border-accent-blue/30 bg-gradient-to-br from-accent-blue/5 to-transparent">
        <CardContent className="py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  Checkpoint de Planejamento
                </h1>
                <p className="text-sm text-text-secondary">
                  Revise os dados coletados e aprove o plano de pesquisa
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-status-warning/10 border border-status-warning/30 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-status-warning" />
                <span className="text-sm text-status-warning font-medium">
                  Aguardando aprovação
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Visual Summary (Read-only) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-accent-purple" />
              <div>
                <CardTitle>Dados Coletados</CardTitle>
                <CardDescription>
                  Resumo visual do que foi extraído no Gatilho
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
            {/* Theme */}
            {gatilho.tema && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-accent-purple/10 to-transparent border border-accent-purple/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-accent-purple" />
                  <span className="text-sm font-medium text-text-primary">Tema</span>
                </div>
                <p className="text-text-secondary text-sm">{gatilho.tema}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-2 py-1 bg-white/5 rounded-lg text-xs text-text-secondary">
                    {contentTypeLabels[gatilho.tipoConteudo] || gatilho.tipoConteudo}
                  </span>
                  <span className="px-2 py-1 bg-white/5 rounded-lg text-xs text-text-secondary">
                    {durationLabels[gatilho.duracao] || gatilho.duracao}
                  </span>
                </div>
              </div>
            )}

            {/* Emotional Triggers */}
            {gatilho.gatilhosEmocionais.length > 0 && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-status-warning" />
                  <span className="text-sm font-medium text-text-primary">Gatilhos Emocionais</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {gatilho.gatilhosEmocionais.map((trigger) => (
                    <span
                      key={trigger}
                      className="px-2 py-1 bg-accent-purple/10 rounded-lg text-xs text-accent-purple"
                    >
                      {emotionalTriggerLabels[trigger] || trigger}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Competitors */}
            {gatilho.concorrentes.some((c) => c.metadados) && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-text-primary">
                    Vídeos de Referência ({gatilho.concorrentes.filter((c) => c.metadados).length})
                  </span>
                </div>
                <div className="space-y-2">
                  {gatilho.concorrentes
                    .filter((c) => c.metadados)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="flex gap-3 p-2 bg-background/50 rounded-lg"
                      >
                        {c.metadados?.thumbnailUrl && (
                          <img
                            src={c.metadados.thumbnailUrl}
                            alt=""
                            className="w-20 h-12 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate">
                            {c.metadados?.titulo}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-text-secondary">
                            <span className="flex items-center gap-0.5">
                              <Eye className="w-3 h-3" />
                              {formatNumber(c.metadados?.views || 0)}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <ThumbsUp className="w-3 h-3" />
                              {formatNumber(c.metadados?.likes || 0)}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {c.metadados?.duracao}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Channel Data */}
            {canal.conectado && (
              <div className="p-4 rounded-xl bg-status-success/5 border border-status-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-status-success" />
                  <span className="text-sm font-medium text-text-primary">Canal Conectado</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-text-secondary">Nome:</span>
                    <span className="ml-1 text-text-primary">{canal.nome}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Inscritos:</span>
                    <span className="ml-1 text-text-primary">{formatNumber(canal.inscritos)}</span>
                  </div>
                  {canal.metricas30dias && (
                    <>
                      <div>
                        <span className="text-text-secondary">Retenção:</span>
                        <span className="ml-1 text-text-primary">{canal.metricas30dias.retencaoMedia}%</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">Duração ideal:</span>
                        <span className="ml-1 text-text-primary">{canal.metricas30dias.duracaoPerforma}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Active Guidelines */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-accent-blue" />
                <span className="text-sm font-medium text-text-primary">Diretrizes Ativas</span>
              </div>
              <ul className="space-y-1.5 text-xs text-text-secondary">
                {diretrizes.secoesAtivas?.listaNegra !== false && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-status-success" />
                    Lista negra ({diretrizes.listaNegra.length} palavras)
                  </li>
                )}
                {diretrizes.secoesAtivas?.ctasObrigatorios !== false && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-status-success" />
                    CTAs obrigatórios
                  </li>
                )}
                {diretrizes.secoesAtivas?.arquiteturaRoteiro !== false && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-status-success" />
                    Arquitetura do roteiro
                  </li>
                )}
                {(diretrizes.diretrizesCustomizadas?.filter((d) => d.ativa).length || 0) > 0 && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-status-success" />
                    {diretrizes.diretrizesCustomizadas?.filter((d) => d.ativa).length} diretriz(es) personalizada(s)
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel: Editable Research Plan */}
        <Card className="border-accent-purple/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit3 className="w-5 h-5 text-accent-purple" />
                <div>
                  <CardTitle>Plano de Pesquisa</CardTitle>
                  <CardDescription>
                    {isEditing ? 'Modo de edição ativo' : 'Clique para editar'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Regenerar
                </Button>
                <Button
                  variant={isEditing ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  icon={<Edit3 className="w-4 h-4" />}
                >
                  {isEditing ? 'Visualizar' : 'Editar'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={planejamento.planoPesquisa}
                onChange={(e) => setPlanejamento({ planoPesquisa: e.target.value })}
                rows={20}
                className="font-mono text-sm"
                placeholder="Digite o plano de pesquisa..."
              />
            ) : (
              <pre className="p-4 bg-background/50 rounded-xl text-sm text-text-secondary whitespace-pre-wrap font-mono max-h-[450px] overflow-y-auto">
                {planejamento.planoPesquisa || 'Nenhum plano gerado ainda.'}
              </pre>
            )}
            {hasModifications && (
              <div className="mt-3 flex items-center gap-2 text-xs text-status-warning">
                <AlertTriangle className="w-3 h-3" />
                Plano modificado. As alterações serão usadas na pesquisa.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="bg-accent-blue/5 border-accent-blue/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">
                Por que este checkpoint existe?
              </p>
              <p className="text-xs text-text-secondary">
                A fase de Inteligência consome tokens de IA para realizar pesquisas.
                Este checkpoint permite que você revise e ajuste o plano antes de gastar recursos.
                Você pode adicionar instruções específicas, remover pesquisas desnecessárias,
                ou ajustar o foco da análise.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />}>
          Voltar ao Gatilho
        </Button>
        <Button
          size="lg"
          onClick={handleApprove}
          icon={<Play className="w-5 h-5" />}
          className="bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 shadow-lg"
        >
          Aprovar e Executar Pesquisa
        </Button>
      </div>
    </motion.div>
  )
}
