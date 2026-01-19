import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Ban,
  Palette,
  MessageSquare,
  Layout,
  Plus,
  X,
  Save,
  RotateCcw,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui'

export function Diretrizes() {
  const { diretrizes, setDiretrizes, addToast } = useStore()
  const [newWord, setNewWord] = useState('')

  const addToBlacklist = () => {
    if (!newWord.trim()) return
    if (diretrizes.listaNegra.includes(newWord.toLowerCase().trim())) {
      addToast({ type: 'warning', message: 'Palavra já existe na lista' })
      return
    }
    setDiretrizes({
      listaNegra: [...diretrizes.listaNegra, newWord.toLowerCase().trim()],
    })
    setNewWord('')
    addToast({ type: 'success', message: 'Palavra adicionada' })
  }

  const removeFromBlacklist = (word: string) => {
    setDiretrizes({
      listaNegra: diretrizes.listaNegra.filter((w) => w !== word),
    })
    addToast({ type: 'info', message: 'Palavra removida' })
  }

  const handleSave = () => {
    addToast({ type: 'success', message: 'Diretrizes salvas!' })
  }

  const handleReset = () => {
    // Reset to defaults would go here
    addToast({ type: 'info', message: 'Diretrizes resetadas' })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Diretrizes do Canal</h1>
            <p className="text-sm text-text-secondary">
              Regras que a IA seguirá em todas as gerações
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleReset} icon={<RotateCcw className="w-4 h-4" />}>
            Resetar
          </Button>
          <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>
            Salvar
          </Button>
        </div>
      </div>

      {/* Blacklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Ban className="w-5 h-5 text-status-error" />
            <div>
              <CardTitle>Lista Negra</CardTitle>
              <CardDescription>
                Palavras e expressões que nunca devem aparecer nos conteúdos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite uma palavra..."
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addToBlacklist()}
              className="flex-1"
            />
            <Button onClick={addToBlacklist} icon={<Plus className="w-4 h-4" />}>
              Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {diretrizes.listaNegra.map((word) => (
              <motion.span
                key={word}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-status-error/10 border border-status-error/30 rounded-lg text-sm text-status-error"
              >
                {word}
                <button
                  onClick={() => removeFromBlacklist(word)}
                  className="hover:bg-white/10 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visual Style */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-accent-purple" />
            <div>
              <CardTitle>Estilo Visual</CardTitle>
              <CardDescription>
                Regras para thumbnails e imagens geradas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Fontes"
            value={diretrizes.estiloVisual.fontes}
            onChange={(e) =>
              setDiretrizes({
                estiloVisual: { ...diretrizes.estiloVisual, fontes: e.target.value },
              })
            }
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Paleta de Cores
            </label>
            <div className="flex flex-wrap gap-2">
              {diretrizes.estiloVisual.paletaCores.map((color, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-text-secondary"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>
          <Input
            label="Imagens Preferidas"
            value={diretrizes.estiloVisual.imagensPreferidas}
            onChange={(e) =>
              setDiretrizes({
                estiloVisual: {
                  ...diretrizes.estiloVisual,
                  imagensPreferidas: e.target.value,
                },
              })
            }
          />
          <Input
            label="Regras de Texto"
            value={diretrizes.estiloVisual.regrasTexto}
            onChange={(e) =>
              setDiretrizes({
                estiloVisual: {
                  ...diretrizes.estiloVisual,
                  regrasTexto: e.target.value,
                },
              })
            }
          />
        </CardContent>
      </Card>

      {/* CTAs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-status-success" />
            <div>
              <CardTitle>CTAs Obrigatórios</CardTitle>
              <CardDescription>
                Chamadas para ação inseridas automaticamente
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Abertura"
            value={diretrizes.ctasObrigatorios.abertura}
            onChange={(e) =>
              setDiretrizes({
                ctasObrigatorios: {
                  ...diretrizes.ctasObrigatorios,
                  abertura: e.target.value,
                },
              })
            }
            rows={2}
          />
          <Textarea
            label="Meio (E-book)"
            value={diretrizes.ctasObrigatorios.meio}
            onChange={(e) =>
              setDiretrizes({
                ctasObrigatorios: {
                  ...diretrizes.ctasObrigatorios,
                  meio: e.target.value,
                },
              })
            }
            rows={2}
          />
          <Textarea
            label="Fechamento (Grupo VIP)"
            value={diretrizes.ctasObrigatorios.fechamento}
            onChange={(e) =>
              setDiretrizes({
                ctasObrigatorios: {
                  ...diretrizes.ctasObrigatorios,
                  fechamento: e.target.value,
                },
              })
            }
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Script Architecture */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Layout className="w-5 h-5 text-accent-blue" />
            <div>
              <CardTitle>Arquitetura do Roteiro</CardTitle>
              <CardDescription>Estrutura padrão para todos os roteiros</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Abertura Magnética"
              value={diretrizes.arquiteturaRoteiro.aberturaMagnetica}
              onChange={(e) =>
                setDiretrizes({
                  arquiteturaRoteiro: {
                    ...diretrizes.arquiteturaRoteiro,
                    aberturaMagnetica: e.target.value,
                  },
                })
              }
            />
            <Input
              label="Gancho Emocional"
              value={diretrizes.arquiteturaRoteiro.ganchoEmocional}
              onChange={(e) =>
                setDiretrizes({
                  arquiteturaRoteiro: {
                    ...diretrizes.arquiteturaRoteiro,
                    ganchoEmocional: e.target.value,
                  },
                })
              }
            />
            <Input
              label="Desenvolvimento"
              value={diretrizes.arquiteturaRoteiro.desenvolvimento}
              onChange={(e) =>
                setDiretrizes({
                  arquiteturaRoteiro: {
                    ...diretrizes.arquiteturaRoteiro,
                    desenvolvimento: e.target.value,
                  },
                })
              }
            />
            <Input
              label="CTA do Meio"
              value={diretrizes.arquiteturaRoteiro.ctaMeio}
              onChange={(e) =>
                setDiretrizes({
                  arquiteturaRoteiro: {
                    ...diretrizes.arquiteturaRoteiro,
                    ctaMeio: e.target.value,
                  },
                })
              }
            />
            <Input
              label="Fechamento"
              value={diretrizes.arquiteturaRoteiro.fechamento}
              onChange={(e) =>
                setDiretrizes({
                  arquiteturaRoteiro: {
                    ...diretrizes.arquiteturaRoteiro,
                    fechamento: e.target.value,
                  },
                })
              }
            />
            <Input
              label="CTA Final"
              value={diretrizes.arquiteturaRoteiro.ctaFinal}
              onChange={(e) =>
                setDiretrizes({
                  arquiteturaRoteiro: {
                    ...diretrizes.arquiteturaRoteiro,
                    ctaFinal: e.target.value,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
