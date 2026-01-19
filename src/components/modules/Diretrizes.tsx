import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Trash2,
  Copy,
  Check,
  ChevronDown,
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
import type { DiretrizPerfil, DiretrizesContent } from '../../types'

export function Diretrizes() {
  const {
    diretrizes,
    setDiretrizes,
    diretrizPerfis,
    diretrizAtiva,
    addDiretrizPerfil,
    removeDiretrizPerfil,
    setActiveDiretriz,
    updateDiretrizPerfil,
    addToast,
  } = useStore()

  const [newWord, setNewWord] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPerfilName, setNewPerfilName] = useState('')
  const [newPerfilDesc, setNewPerfilDesc] = useState('')
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  const activePerfil = diretrizPerfis.find((p) => p.id === diretrizAtiva)

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
    if (diretrizAtiva) {
      updateDiretrizPerfil(diretrizAtiva, { conteudo: diretrizes })
    }
    addToast({ type: 'success', message: 'Diretrizes salvas!' })
  }

  const handleReset = () => {
    if (activePerfil) {
      setDiretrizes(activePerfil.conteudo)
    }
    addToast({ type: 'info', message: 'Alterações descartadas' })
  }

  const handleCreateProfile = () => {
    if (!newPerfilName.trim()) {
      addToast({ type: 'warning', message: 'Digite um nome para o perfil' })
      return
    }

    const newPerfil: DiretrizPerfil = {
      id: Date.now().toString(),
      nome: newPerfilName.trim(),
      descricao: newPerfilDesc.trim(),
      criadoEm: new Date().toISOString(),
      conteudo: { ...diretrizes } as DiretrizesContent,
    }

    addDiretrizPerfil(newPerfil)
    setShowCreateModal(false)
    setNewPerfilName('')
    setNewPerfilDesc('')
    addToast({ type: 'success', message: 'Perfil criado!' })
  }

  const handleDuplicateProfile = () => {
    if (!activePerfil) return

    const newPerfil: DiretrizPerfil = {
      id: Date.now().toString(),
      nome: `${activePerfil.nome} (cópia)`,
      descricao: activePerfil.descricao,
      criadoEm: new Date().toISOString(),
      conteudo: { ...activePerfil.conteudo },
    }

    addDiretrizPerfil(newPerfil)
    addToast({ type: 'success', message: 'Perfil duplicado!' })
  }

  const handleDeleteProfile = (id: string) => {
    if (id === 'default') {
      addToast({ type: 'warning', message: 'Não é possível excluir o perfil padrão' })
      return
    }
    removeDiretrizPerfil(id)
    addToast({ type: 'info', message: 'Perfil excluído' })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
            Descartar
          </Button>
          <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>
            Salvar
          </Button>
        </div>
      </div>

      {/* Profile Selector */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <span className="text-sm text-text-secondary">Perfil ativo:</span>
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors min-w-[200px]"
                >
                  <span className="text-sm font-medium text-text-primary flex-1 text-left">
                    {activePerfil?.nome || 'Selecionar'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-text-secondary transition-transform ${
                      showProfileDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-72 bg-card border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      {diretrizPerfis.map((perfil) => (
                        <div
                          key={perfil.id}
                          className={`flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer ${
                            perfil.id === diretrizAtiva ? 'bg-white/5' : ''
                          }`}
                        >
                          <div
                            className="flex-1"
                            onClick={() => {
                              setActiveDiretriz(perfil.id)
                              setShowProfileDropdown(false)
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-text-primary">
                                {perfil.nome}
                              </span>
                              {perfil.id === diretrizAtiva && (
                                <Check className="w-4 h-4 text-status-success" />
                              )}
                            </div>
                            {perfil.descricao && (
                              <p className="text-xs text-text-secondary mt-0.5">
                                {perfil.descricao}
                              </p>
                            )}
                          </div>
                          {perfil.id !== 'default' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteProfile(perfil.id)
                              }}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-status-error transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDuplicateProfile}
                icon={<Copy className="w-4 h-4" />}
              >
                Duplicar
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Novo Perfil
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Profile Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-text-primary mb-4">Criar Novo Perfil</h2>
              <div className="space-y-4">
                <Input
                  label="Nome do Perfil"
                  placeholder="Ex: Canal Secundário"
                  value={newPerfilName}
                  onChange={(e) => setNewPerfilName(e.target.value)}
                />
                <Textarea
                  label="Descrição (opcional)"
                  placeholder="Ex: Diretrizes para o canal de meditação"
                  value={newPerfilDesc}
                  onChange={(e) => setNewPerfilDesc(e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-text-secondary">
                  O novo perfil será criado com base nas diretrizes atuais.
                </p>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateProfile} icon={<Plus className="w-4 h-4" />}>
                  Criar Perfil
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
