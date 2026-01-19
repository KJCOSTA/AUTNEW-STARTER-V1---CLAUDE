import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Zap, Clock, DollarSign, Check, Cpu } from 'lucide-react'
import {
  type PipelineAction,
  getModelsByAnyRole,
  getModel,
  estimateCost,
} from '../../config/aiRegistry'

interface ModelSelectorProps {
  action: PipelineAction
  selectedProvider: string
  selectedModel: string
  onChange: (providerId: string, modelId: string) => void
  disabled?: boolean
}

export function ModelSelector({
  action,
  selectedProvider,
  selectedModel,
  onChange,
  disabled = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Get compatible models for this action's roles
  const compatibleModels = getModelsByAnyRole(action.requiredRoles)

  // Get current selection info
  const currentSelection = getModel(selectedProvider, selectedModel)
  const currentCost = estimateCost(selectedProvider, selectedModel, action.estimatedTokens)

  const speedIcons = {
    fast: <Zap className="w-3 h-3 text-status-success" />,
    medium: <Clock className="w-3 h-3 text-status-warning" />,
    slow: <Clock className="w-3 h-3 text-status-error" />,
  }

  const speedLabels = {
    fast: 'Rápido',
    medium: 'Médio',
    slow: 'Lento',
  }

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/20'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Cpu className="w-4 h-4 text-accent-purple flex-shrink-0" />
          <span className="text-text-primary truncate">
            {currentSelection
              ? `${currentSelection.provider.name} / ${currentSelection.model.name}`
              : 'Selecionar modelo'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {currentSelection && (
            <>
              {speedIcons[currentSelection.model.speed]}
              <span className="text-xs text-text-secondary">
                ~${currentCost.toFixed(4)}
              </span>
            </>
          )}
          <ChevronDown
            className={`w-4 h-4 text-text-secondary transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-card border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
            >
              {compatibleModels.length === 0 ? (
                <div className="p-4 text-center text-text-secondary text-sm">
                  Nenhum modelo compatível encontrado
                </div>
              ) : (
                <div className="py-1">
                  {compatibleModels.map(({ provider, model }) => {
                    const isSelected =
                      provider.id === selectedProvider && model.id === selectedModel
                    const cost = estimateCost(provider.id, model.id, action.estimatedTokens)

                    return (
                      <button
                        key={`${provider.id}:${model.id}`}
                        type="button"
                        onClick={() => {
                          onChange(provider.id, model.id)
                          setIsOpen(false)
                        }}
                        className={`w-full px-3 py-2.5 text-left hover:bg-white/5 transition-colors ${
                          isSelected ? 'bg-white/5' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-text-primary">
                                {model.name}
                              </span>
                              {isSelected && (
                                <Check className="w-3 h-3 text-status-success flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-text-secondary">
                                {provider.name}
                              </span>
                              <span className="text-xs text-text-secondary/50">•</span>
                              <span className="text-xs text-text-secondary">
                                {model.description}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex items-center gap-1">
                              {speedIcons[model.speed]}
                              <span className="text-xs text-text-secondary">
                                {speedLabels[model.speed]}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-status-warning" />
                              <span className="text-xs text-text-secondary">
                                ${cost.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Roles tags */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {model.roles.slice(0, 4).map((role) => (
                            <span
                              key={role}
                              className={`px-1.5 py-0.5 text-[10px] rounded ${
                                action.requiredRoles.includes(role)
                                  ? 'bg-status-success/20 text-status-success'
                                  : 'bg-white/5 text-text-secondary'
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                          {model.roles.length > 4 && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-white/5 text-text-secondary rounded">
                              +{model.roles.length - 4}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// ACTION MODEL SELECTOR - For phase transitions
// ============================================

interface ActionModelSelectorProps {
  actions: PipelineAction[]
  modelSelections: Record<string, { provider: string; model: string }>
  onModelChange: (actionId: string, providerId: string, modelId: string) => void
  title?: string
  description?: string
}

export function ActionModelSelector({
  actions,
  modelSelections,
  onModelChange,
  title = 'Configurar Modelos de IA',
  description = 'Selecione o modelo para cada ação',
}: ActionModelSelectorProps) {
  // Calculate total estimated cost
  const totalCost = actions.reduce((sum, action) => {
    const selection = modelSelections[action.id] || {
      provider: action.defaultProvider,
      model: action.defaultModel,
    }
    return sum + estimateCost(selection.provider, selection.model, action.estimatedTokens)
  }, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-text-primary">{title}</h3>
          <p className="text-xs text-text-secondary">{description}</p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 bg-status-warning/10 border border-status-warning/20 rounded-lg">
          <DollarSign className="w-3 h-3 text-status-warning" />
          <span className="text-xs text-status-warning">
            Custo estimado: ${totalCost.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {actions.map((action) => {
          const selection = modelSelections[action.id] || {
            provider: action.defaultProvider,
            model: action.defaultModel,
          }

          return (
            <div
              key={action.id}
              className="p-3 bg-white/5 border border-white/10 rounded-xl"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h4 className="text-sm font-medium text-text-primary">
                    {action.label}
                  </h4>
                  <p className="text-xs text-text-secondary">{action.description}</p>
                </div>
                <div className="flex gap-1">
                  {action.requiredRoles.map((role) => (
                    <span
                      key={role}
                      className="px-1.5 py-0.5 text-[10px] bg-accent-purple/20 text-accent-purple rounded"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <ModelSelector
                action={action}
                selectedProvider={selection.provider}
                selectedModel={selection.model}
                onChange={(providerId, modelId) =>
                  onModelChange(action.id, providerId, modelId)
                }
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ModelSelector
