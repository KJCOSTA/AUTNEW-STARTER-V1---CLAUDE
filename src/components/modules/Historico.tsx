import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Search,
  Star,
  Trash2,
  Copy,
  Eye,
  Download,
  Calendar,
  Film,
  Image,
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
} from '../ui'
import type { Producao } from '../../types'

export function Historico() {
  const { historico, removeProducao, toggleFavorito, addToast } = useStore()
  const [search, setSearch] = useState('')
  const [selectedProducao, setSelectedProducao] = useState<Producao | null>(null)

  const filteredHistorico = historico.filter(
    (p) =>
      p.tema.toLowerCase().includes(search.toLowerCase()) ||
      p.titulo.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleExport = () => {
    const data = JSON.stringify(historico, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `autnew-historico-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', message: 'Histórico exportado!' })
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta produção?')) {
      removeProducao(id)
      if (selectedProducao?.id === id) {
        setSelectedProducao(null)
      }
      addToast({ type: 'info', message: 'Produção excluída' })
    }
  }

  const contentTypeLabels: Record<string, string> = {
    'oracao-guiada': 'Oração Guiada',
    'meditacao-espiritual': 'Meditação Espiritual',
    'reflexao-biblica': 'Reflexão Bíblica',
    'salmo-narrado': 'Salmo Narrado',
    'mensagem-fe': 'Mensagem de Fé',
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Histórico de Produções</h1>
            <p className="text-sm text-text-secondary">
              {historico.length} {historico.length === 1 ? 'produção' : 'produções'} salvas
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={historico.length === 0}
          icon={<Download className="w-4 h-4" />}
        >
          Exportar JSON
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <Input
            placeholder="Buscar por tema ou título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 space-y-3">
          {filteredHistorico.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-text-secondary opacity-50" />
                <p className="text-text-secondary">
                  {search
                    ? 'Nenhuma produção encontrada'
                    : 'Nenhuma produção no histórico'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredHistorico.map((producao, index) => (
                <motion.div
                  key={producao.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    hover
                    className={`cursor-pointer ${
                      selectedProducao?.id === producao.id
                        ? 'ring-2 ring-accent-blue'
                        : ''
                    }`}
                    onClick={() => setSelectedProducao(producao)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="w-32 h-20 rounded-lg bg-background flex-shrink-0 overflow-hidden">
                          {producao.thumbnailUrl ? (
                            <img
                              src={producao.thumbnailUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-8 h-8 text-text-secondary" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-text-primary truncate">
                                {producao.titulo || producao.tema}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                                <span className="px-2 py-0.5 bg-white/5 rounded">
                                  {contentTypeLabels[producao.tipoConteudo]}
                                </span>
                                <span>{producao.duracao}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorito(producao.id)
                              }}
                              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  producao.favorito
                                    ? 'fill-status-warning text-status-warning'
                                    : 'text-text-secondary'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1 text-xs text-text-secondary">
                              <Calendar className="w-3 h-3" />
                              {formatDate(producao.dataCriacao)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Detail Panel */}
        {selectedProducao && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-96 flex-shrink-0"
          >
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="truncate">{selectedProducao.titulo}</CardTitle>
                <CardDescription>
                  Criado em {formatDate(selectedProducao.dataCriacao)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Thumbnail */}
                {selectedProducao.thumbnailUrl && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-background">
                    <img
                      src={selectedProducao.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Tipo</span>
                    <span className="text-text-primary">
                      {contentTypeLabels[selectedProducao.tipoConteudo]}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Duração</span>
                    <span className="text-text-primary">{selectedProducao.duracao}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Gatilhos</span>
                    <span className="text-text-primary">
                      {selectedProducao.gatilho.gatilhosEmocionais.length}
                    </span>
                  </div>
                </div>

                {/* Tema */}
                <div>
                  <p className="text-xs text-text-secondary mb-1">Tema</p>
                  <p className="text-sm text-text-primary">
                    {selectedProducao.tema}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    icon={<Eye className="w-4 h-4" />}
                  >
                    Abrir
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    icon={<Copy className="w-4 h-4" />}
                  >
                    Duplicar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(selectedProducao.id)}
                    icon={<Trash2 className="w-4 h-4" />}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
