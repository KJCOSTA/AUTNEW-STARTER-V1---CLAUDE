import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  FileText,
  Activity,
  Clock,
  Settings,
  Sparkles,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Youtube,
} from 'lucide-react'
import type { ModuleName, CanalData } from '../../types'
import { useStore } from '../../store/useStore'
import clsx from 'clsx'

interface SidebarProps {
  activeModule: ModuleName
  onModuleChange: (module: ModuleName) => void
}

const menuItems = [
  { id: 'plan-run' as ModuleName, label: 'Plan Run', icon: Play },
  { id: 'diretrizes' as ModuleName, label: 'Diretrizes', icon: FileText },
  { id: 'monitor' as ModuleName, label: 'Monitor', icon: Activity },
  { id: 'historico' as ModuleName, label: 'Histórico', icon: Clock },
  { id: 'configuracoes' as ModuleName, label: 'Configurações', icon: Settings },
]

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const { canal, canais, canalAtivo, addCanal, removeCanal, setActiveCanal, addToast } = useStore()

  const [showCanalDropdown, setShowCanalDropdown] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCanal, setEditingCanal] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newCanalName, setNewCanalName] = useState('')

  const handleAddCanal = () => {
    if (!newCanalName.trim()) {
      addToast({ type: 'error', message: 'Nome do canal é obrigatório' })
      return
    }

    // Check if canal already exists
    if (canais.some(c => c.nome.toLowerCase() === newCanalName.trim().toLowerCase())) {
      addToast({ type: 'error', message: 'Já existe um canal com esse nome' })
      return
    }

    const newCanal: CanalData = {
      nome: newCanalName.trim(),
      inscritos: 0,
      conectado: false,
      metricas30dias: null,
    }

    addCanal(newCanal)
    setNewCanalName('')
    setShowAddModal(false)
    setShowCanalDropdown(false)
    addToast({ type: 'success', message: `Canal "${newCanal.nome}" adicionado!` })
  }

  const handleEditCanal = (canalNome: string) => {
    setEditingCanal(canalNome)
    setEditName(canalNome)
  }

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingCanal) return

    // Check if name already exists (except current)
    if (canais.some(c => c.nome.toLowerCase() === editName.trim().toLowerCase() && c.nome !== editingCanal)) {
      addToast({ type: 'error', message: 'Já existe um canal com esse nome' })
      return
    }

    // Find the canal being edited and update it
    const canalToUpdate = canais.find(c => c.nome === editingCanal)
    if (canalToUpdate) {
      // Update the canal name in the list
      // Since we use nome as ID, we need to remove and re-add
      removeCanal(editingCanal)
      addCanal({ ...canalToUpdate, nome: editName.trim() })

      // If it was the active canal, update that too
      if (canalAtivo === editingCanal) {
        setActiveCanal(editName.trim())
      }
    }

    setEditingCanal(null)
    setEditName('')
    addToast({ type: 'success', message: 'Canal atualizado!' })
  }

  const handleDeleteCanal = (canalNome: string) => {
    if (canais.length <= 1) {
      addToast({ type: 'error', message: 'Você precisa ter pelo menos um canal' })
      return
    }

    removeCanal(canalNome)
    addToast({ type: 'success', message: `Canal "${canalNome}" removido` })
  }

  const handleSelectCanal = (canalNome: string) => {
    setActiveCanal(canalNome)
    setShowCanalDropdown(false)
    addToast({ type: 'info', message: `Canal alterado para "${canalNome}"` })
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-white/5 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">AUTNEW</h1>
            <p className="text-xs text-text-secondary">Starter V1</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeModule === item.id

            return (
              <li key={item.id}>
                <button
                  data-nav={item.id}
                  onClick={() => onModuleChange(item.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gradient-accent text-white shadow-lg shadow-accent-blue/20'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-white"
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Channel Management Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="relative">
          {/* Channel Selector Button */}
          <button
            onClick={() => setShowCanalDropdown(!showCanalDropdown)}
            className="w-full px-4 py-3 rounded-xl bg-background/50 hover:bg-background/70 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Youtube className="w-4 h-4 text-red-400 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-xs text-text-secondary">Canal Ativo</p>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {canal?.nome || canalAtivo || 'Selecione'}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={clsx(
                  'w-4 h-4 text-text-secondary transition-transform',
                  showCanalDropdown && 'rotate-180'
                )}
              />
            </div>
          </button>

          {/* Channel Dropdown */}
          <AnimatePresence>
            {showCanalDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto"
              >
                {/* Channel List */}
                <div className="p-2">
                  <p className="text-xs text-text-secondary px-2 py-1 mb-1">Seus Canais</p>
                  {canais.map((c) => (
                    <div
                      key={c.nome}
                      className={clsx(
                        'group flex items-center gap-2 p-2 rounded-lg transition-colors',
                        c.nome === canalAtivo
                          ? 'bg-accent-blue/10'
                          : 'hover:bg-white/5'
                      )}
                    >
                      {editingCanal === c.nome ? (
                        // Edit Mode
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-background px-2 py-1 rounded text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit()
                              if (e.key === 'Escape') setEditingCanal(null)
                            }}
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 rounded hover:bg-status-success/20 text-status-success"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingCanal(null)}
                            className="p-1 rounded hover:bg-status-error/20 text-status-error"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        // Normal Mode
                        <>
                          <button
                            onClick={() => handleSelectCanal(c.nome)}
                            className="flex-1 flex items-center gap-2 text-left"
                          >
                            <div className={clsx(
                              'w-2 h-2 rounded-full flex-shrink-0',
                              c.conectado ? 'bg-status-success' : 'bg-text-secondary'
                            )} />
                            <span className={clsx(
                              'text-sm truncate',
                              c.nome === canalAtivo
                                ? 'text-accent-blue font-medium'
                                : 'text-text-primary'
                            )}>
                              {c.nome}
                            </span>
                            {c.nome === canalAtivo && (
                              <Check className="w-4 h-4 text-accent-blue flex-shrink-0 ml-auto" />
                            )}
                          </button>

                          {/* Edit/Delete buttons - visible on hover */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditCanal(c.nome)
                              }}
                              className="p-1 rounded hover:bg-white/10 text-text-secondary hover:text-text-primary"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {canais.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteCanal(c.nome)
                                }}
                                className="p-1 rounded hover:bg-status-error/20 text-text-secondary hover:text-status-error"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Channel Button */}
                <div className="border-t border-white/10 p-2">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 text-accent-blue transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Adicionar Canal</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Channel Modal */}
          <AnimatePresence>
            {showAddModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
                onClick={() => setShowAddModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card border border-white/10 rounded-2xl p-6 w-96 shadow-2xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <Youtube className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">Novo Canal</h3>
                      <p className="text-sm text-text-secondary">Adicione um canal ao sistema</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        Nome do Canal
                      </label>
                      <input
                        type="text"
                        value={newCanalName}
                        onChange={(e) => setNewCanalName(e.target.value)}
                        placeholder="Ex: Orações da Manhã"
                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-blue"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCanal()
                          if (e.key === 'Escape') setShowAddModal(false)
                        }}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-text-secondary hover:bg-white/5 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAddCanal}
                        disabled={!newCanalName.trim()}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-accent text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Channel Stats (if connected) */}
        {canal?.conectado && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 px-4 py-2 rounded-lg bg-status-success/10 border border-status-success/20"
          >
            <div className="flex items-center gap-2 text-status-success">
              <Check className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">YouTube Conectado</span>
            </div>
            {canal.inscritos > 0 && (
              <p className="text-xs text-text-secondary mt-1">
                {canal.inscritos.toLocaleString()} inscritos
              </p>
            )}
          </motion.div>
        )}
      </div>
    </aside>
  )
}
