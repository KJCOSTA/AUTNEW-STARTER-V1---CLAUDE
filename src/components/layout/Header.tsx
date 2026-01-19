import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  User,
  FlaskConical,
  Settings,
  Youtube,
  History,
  LogOut,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Button } from '../ui'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

export function Header() {
  const { configuracoes, setConfiguracoes, addToast } = useStore()
  const isMVP = configuracoes.modo === 'mvp'
  const isTestMode = configuracoes.appMode === 'test'

  // Dropdown states
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false)
  const [showTestModeConfirm, setShowTestModeConfirm] = useState(false)

  // Refs for click outside detection
  const profileRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Mock notifications (in production, this would come from store/backend)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Sistema pronto',
      message: 'AUTNEW Starter V1 carregado com sucesso',
      timestamp: new Date(),
      read: false,
    },
    {
      id: '2',
      type: 'info',
      title: 'Dica',
      message: 'Configure suas API Keys em Configuracoes para comecar',
      timestamp: new Date(Date.now() - 60000),
      read: false,
    },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotificationsPanel(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleTestMode = () => {
    if (isTestMode) {
      // Going to production - needs confirmation
      setShowTestModeConfirm(true)
    } else {
      // Going to test mode - no confirmation needed
      setConfiguracoes({ appMode: 'test' })
      addToast({ type: 'info', message: 'Modo Teste ativado - dados simulados' })
    }
  }

  const confirmProductionMode = () => {
    setConfiguracoes({ appMode: 'production' })
    setShowTestModeConfirm(false)
    addToast({ type: 'success', message: 'Modo Producao ativado - APIs reais!' })
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const clearNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-status-success" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-status-warning" />
      case 'error': return <AlertCircle className="w-4 h-4 text-status-error" />
      default: return <Info className="w-4 h-4 text-accent-blue" />
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}min atras`
    if (hours < 24) return `${hours}h atras`
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <>
      <header className="h-16 border-b border-white/5 bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
        {/* Left side - Mode indicators */}
        <div className="flex items-center gap-6">
          {/* Test Mode Badge */}
          {isTestMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30"
            >
              <FlaskConical className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Test Mode
              </span>
            </motion.div>
          )}

          {/* Operation Mode indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isMVP ? 'bg-status-warning' : 'bg-status-success'
              }`}
            />
            <span className="text-sm text-text-secondary">
              Modo {isMVP ? 'MVP' : 'Producao'}
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Test Mode Toggle - Same behavior as Configuracoes */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <FlaskConical
              className={`w-4 h-4 ${isTestMode ? 'text-amber-400' : 'text-text-secondary'}`}
            />
            <button
              onClick={handleToggleTestMode}
              className="flex items-center gap-2"
            >
              {isTestMode ? (
                <ToggleRight className="w-6 h-6 text-amber-500" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-text-secondary" />
              )}
              <span className={`text-xs font-medium ${
                isTestMode ? 'text-amber-400' : 'text-status-success'
              }`}>
                {isTestMode ? 'TESTE' : 'PRODUCAO'}
              </span>
            </button>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
              className="relative p-2 rounded-lg bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-status-error text-white text-xs flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            {/* Notifications Panel */}
            <AnimatePresence>
              {showNotificationsPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="font-semibold text-text-primary">Notificacoes</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-accent-blue hover:text-accent-blue/80"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-10 h-10 mx-auto mb-3 text-text-secondary/30" />
                        <p className="text-text-secondary text-sm">
                          Nenhuma notificacao no momento
                        </p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-accent-blue/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-text-primary truncate">
                                  {notification.title}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    clearNotification(notification.id)
                                  }}
                                  className="p-1 hover:bg-white/10 rounded text-text-secondary"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-xs text-text-secondary mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-xs text-text-secondary/60 mt-1">
                                {formatTimestamp(notification.timestamp)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-accent-blue flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-white/10 bg-background/50">
                      <button
                        onClick={() => {
                          setShowNotificationsPanel(false)
                          addToast({ type: 'info', message: 'Historico de notificacoes em desenvolvimento' })
                        }}
                        className="w-full text-center text-xs text-accent-blue hover:text-accent-blue/80"
                      >
                        Ver todas as notificacoes
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-9 h-9 rounded-full bg-gradient-accent flex items-center justify-center"
            >
              <User className="w-5 h-5 text-white" />
            </motion.button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  {/* User Info */}
                  <div className="p-4 border-b border-white/10">
                    {configuracoes.youtube.conectado ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {configuracoes.youtube.canalNome || 'Canal conectado'}
                          </p>
                          <p className="text-xs text-text-secondary flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-status-success" />
                            YouTube conectado
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">Visitante</p>
                          <p className="text-xs text-text-secondary">
                            YouTube nao conectado
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {!configuracoes.youtube.conectado && (
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false)
                          addToast({ type: 'info', message: 'Redirecionando para autenticacao do YouTube...' })
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition-colors"
                      >
                        <Youtube className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-text-primary">Conectar YouTube</span>
                      </button>
                    )}

                    {configuracoes.youtube.conectado && (
                      <a
                        href="https://studio.youtube.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowProfileDropdown(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition-colors"
                      >
                        <Youtube className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-text-primary">Meu Canal no YouTube</span>
                        <ExternalLink className="w-3 h-3 text-text-secondary ml-auto" />
                      </a>
                    )}

                    <button
                      onClick={() => {
                        setShowProfileDropdown(false)
                        // Navigate to Configuracoes
                        const configButton = document.querySelector('[data-nav="configuracoes"]')
                        if (configButton) (configButton as HTMLElement).click()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition-colors"
                    >
                      <Settings className="w-4 h-4 text-text-secondary" />
                      <span className="text-sm text-text-primary">Configuracoes</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileDropdown(false)
                        // Navigate to Historico
                        const histButton = document.querySelector('[data-nav="historico"]')
                        if (histButton) (histButton as HTMLElement).click()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition-colors"
                    >
                      <History className="w-4 h-4 text-text-secondary" />
                      <span className="text-sm text-text-primary">Historico de Producoes</span>
                    </button>

                    {configuracoes.youtube.conectado && (
                      <>
                        <div className="border-t border-white/10 my-2" />
                        <button
                          onClick={() => {
                            setConfiguracoes({
                              youtube: { conectado: false, canalNome: '' },
                            })
                            setShowProfileDropdown(false)
                            addToast({ type: 'info', message: 'YouTube desconectado' })
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-status-error" />
                          <span className="text-sm text-status-error">Desconectar</span>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Test Mode Confirmation Modal - Same as Configuracoes */}
      <AnimatePresence>
        {showTestModeConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTestModeConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-status-warning/20 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-status-warning" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Atencao</h2>
                  <p className="text-sm text-text-secondary">Confirme a mudanca de modo</p>
                </div>
              </div>

              <div className="p-4 bg-status-warning/10 border border-status-warning/20 rounded-xl mb-4">
                <p className="text-sm text-text-primary mb-3">
                  Ao desativar o Modo Teste, todas as operacoes serao <strong className="text-status-warning">REAIS</strong>:
                </p>
                <ul className="text-sm text-text-secondary space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                    APIs serao chamadas (pode gerar custos)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                    Videos serao renderizados de verdade
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                    Uploads para o YouTube serao reais
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                    Creditos das APIs serao consumidos
                  </li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowTestModeConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmProductionMode}
                  className="bg-status-warning hover:bg-status-warning/90 text-black"
                >
                  Confirmar - Ir para Producao
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
