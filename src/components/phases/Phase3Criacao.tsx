import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Palette,
  Image,
  Sparkles,
  Check,
  RefreshCw,
  Loader2,
  Wand2,
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

interface Phase3CriacaoProps {
  onNext: () => void
  onBack: () => void
}

export function Phase3Criacao({ onNext, onBack }: Phase3CriacaoProps) {
  const {
    gatilho,
    inteligencia,
    criacao,
    setCriacao,
    diretrizes,
    addToast,
  } = useStore()
  const [generating, setGenerating] = useState(false)
  const [generatingThumb, setGeneratingThumb] = useState<number | null>(null)

  // Generate options on mount if not already generated
  useEffect(() => {
    if (criacao.opcoes.length === 0) {
      generateOptions()
    }
  }, [])

  const generateOptions = async () => {
    setGenerating(true)
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
          inteligencia,
          diretrizes,
        }),
      })

      let options: OpcaoCriacao[] = [
        {
          id: 1,
          titulo: `${gatilho.tema} - Oração Poderosa Para Sua Vida`,
          conceitoThumbnail:
            'Pessoa idosa de mãos postas em oração, luz dourada celestial ao fundo, expressão de paz e serenidade',
          goldenHook:
            'Você já sentiu que suas orações não estão sendo ouvidas? Nos próximos minutos, eu vou te mostrar como conectar seu coração diretamente com Deus...',
          thumbnailPrompt:
            'Elderly person with hands in prayer, golden celestial light background, peaceful serene expression, spiritual atmosphere, 16:9 aspect ratio',
        },
        {
          id: 2,
          titulo: `PARE TUDO e Faça Esta Oração Agora - ${gatilho.tipoConteudo === 'oracao-guiada' ? 'Oração Guiada' : 'Meditação'}`,
          conceitoThumbnail:
            'Mãos erguidas para o céu com raios de luz, nuvens celestiais, atmosfera de milagre',
          goldenHook:
            'Esta oração mudou a vida de milhares de pessoas. E hoje, ela pode mudar a sua também...',
          thumbnailPrompt:
            'Hands raised to the sky with rays of light, celestial clouds, miracle atmosphere, spiritual, 16:9 aspect ratio',
        },
        {
          id: 3,
          titulo: `A Oração Que Deus Sempre Ouve - ${gatilho.gatilhosEmocionais[0] || 'Esperança'} e Fé`,
          conceitoThumbnail:
            'Bíblia aberta com luz emanando, ambiente acolhedor e espiritual, tons quentes',
          goldenHook:
            'Existe uma forma de orar que toca o coração de Deus instantaneamente. E ela está esquecida pela maioria das pessoas...',
          thumbnailPrompt:
            'Open Bible with light emanating, cozy spiritual environment, warm tones, divine presence, 16:9 aspect ratio',
        },
      ]

      if (response.ok) {
        const data = await response.json()
        if (data.options && data.options.length > 0) {
          options = data.options
        }
      }

      setCriacao({ opcoes: options, opcaoSelecionada: null })
      addToast({ type: 'success', message: 'Opções geradas com sucesso!' })
    } catch (error) {
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
        throw new Error('Erro na API')
      }
    } catch (error) {
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
          inteligencia,
          diretrizes,
        }),
      })

      let roteiro = `[00:00-00:15] ABERTURA MAGNÉTICA
${selectedOption?.goldenHook}

[00:15-00:30] GANCHO EMOCIONAL
Talvez você esteja passando por um momento difícil... Talvez o peso da vida esteja te sufocando... Mas eu quero que você saiba: você não está sozinho. Deus está aqui, agora, neste exato momento, esperando você abrir seu coração.

[00:30-01:30] DESENVOLVIMENTO - PARTE 1
Vamos juntos nesta jornada de oração. Feche seus olhos... Respire fundo... [pausa de 3 segundos]

Senhor, eu venho até Ti com o coração aberto. Tu conheces cada dor que carrego, cada medo que me paralisa, cada lágrima que derramei em silêncio.

[01:30-03:00] DESENVOLVIMENTO - PARTE 2
[pausa suave] A Bíblia nos ensina em Filipenses 4:6-7: "Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, com ação de graças, apresentem seus pedidos a Deus."

${diretrizes.ctasObrigatorios.meio}

[03:00-05:00] ORAÇÃO CENTRAL
Pai Celestial... [voz mais suave, pausada]
Eu entrego nas Tuas mãos todos os meus medos...
Todas as minhas preocupações...
Todos os meus sonhos...
[pausa de 2 segundos]

Tu és o Deus que acalma tempestades...
Tu és o Deus que cura feridas...
Tu és o Deus que restaura esperanças...

[05:00-06:00] MOMENTO DE SILÊNCIO E REFLEXÃO
[música suave ao fundo]
Fique em silêncio agora... Permita que a presença de Deus preencha cada espaço vazio do seu coração...
[pausa de 10 segundos]

[06:00-07:00] ENCERRAMENTO COM ESPERANÇA
Lembre-se sempre: você é amado. Você é especial aos olhos de Deus. Não importa o que esteja enfrentando, Ele está trabalhando em seu favor neste exato momento.

[07:00-07:30] CTA FINAL
${diretrizes.ctasObrigatorios.fechamento}

Se esta oração tocou seu coração, deixe um "amém" nos comentários. E não se esqueça de se inscrever no canal para receber mais orações como esta.

Que a paz do Senhor esteja com você. Até a próxima. 🙏`

      if (response.ok) {
        const data = await response.json()
        if (data.script) {
          roteiro = data.script
        }
      }

      setCriacao({ roteiro })
      addToast({ type: 'success', message: 'Roteiro gerado com sucesso!' })
    } catch (error) {
      addToast({ type: 'error', message: 'Erro ao gerar roteiro' })
    } finally {
      setGenerating(false)
    }
  }

  const handleSelectOption = (id: number) => {
    setCriacao({ opcaoSelecionada: id })
    if (!criacao.roteiro) {
      // Auto-generate script when selecting option
      setTimeout(() => generateRoteiro(), 100)
    }
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
                  Selecione a opção que mais combina com seu conteúdo
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
                <p className="text-text-secondary">Gerando opções criativas...</p>
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
