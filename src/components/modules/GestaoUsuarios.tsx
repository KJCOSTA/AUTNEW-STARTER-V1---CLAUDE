import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Key,
  ToggleLeft,
  ToggleRight,
  Shield,
  User as UserIcon,
  Eye,
  Mail,
  Calendar,
  Clock,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  EyeOff,
} from 'lucide-react'
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui'
import { useAuth, useAuthToken } from '../../contexts/AuthContext'
import { useStore } from '../../store/useStore'
import type { User, UserRole } from '../../types'

const ROLE_LABELS: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-accent-purple/20 text-accent-purple' },
  editor: { label: 'Editor', color: 'bg-accent-blue/20 text-accent-blue' },
  viewer: { label: 'Visualizador', color: 'bg-status-success/20 text-status-success' },
}

export function GestaoUsuarios() {
  const { user: currentUser } = useAuth()
  const { addToast } = useStore()
  const token = useAuthToken()

  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    senha: '',
    role: 'viewer' as UserRole,
  })
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'list' }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUsers(data.users)
      } else {
        setError(data.error || 'Erro ao carregar usuários')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [token])

  // Create user
  const handleCreateUser = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'create', ...formData }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        addToast({ type: 'success', message: 'Usuário criado com sucesso!' })
        setShowCreateModal(false)
        setFormData({ email: '', nome: '', senha: '', role: 'viewer' })
        fetchUsers()
      } else {
        addToast({ type: 'error', message: data.error || 'Erro ao criar usuário' })
      }
    } catch {
      addToast({ type: 'error', message: 'Erro de conexão' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update',
          id: selectedUser.id,
          email: formData.email,
          nome: formData.nome,
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        addToast({ type: 'success', message: 'Usuário atualizado!' })
        setShowEditModal(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        addToast({ type: 'error', message: data.error || 'Erro ao atualizar usuário' })
      }
    } catch {
      addToast({ type: 'error', message: 'Erro de conexão' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle user active status
  const handleToggleActive = async (user: User) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update',
          id: user.id,
          ativo: !user.ativo,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        addToast({
          type: 'info',
          message: user.ativo ? 'Usuário desativado' : 'Usuário ativado',
        })
        fetchUsers()
      } else {
        addToast({ type: 'error', message: data.error || 'Erro ao atualizar usuário' })
      }
    } catch {
      addToast({ type: 'error', message: 'Erro de conexão' })
    }
  }

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'delete', id: selectedUser.id }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        addToast({ type: 'success', message: 'Usuário deletado!' })
        setShowDeleteModal(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        addToast({ type: 'error', message: data.error || 'Erro ao deletar usuário' })
      }
    } catch {
      addToast({ type: 'error', message: 'Erro de conexão' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset password
  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'reset-password',
          id: selectedUser.id,
          novaSenha: newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        addToast({ type: 'success', message: 'Senha resetada!' })
        setShowResetPasswordModal(false)
        setSelectedUser(null)
        setNewPassword('')
        fetchUsers()
      } else {
        addToast({ type: 'error', message: data.error || 'Erro ao resetar senha' })
      }
    } catch {
      addToast({ type: 'error', message: 'Erro de conexão' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open edit modal
  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      nome: user.nome,
      senha: '',
      role: user.role,
    })
    setShowEditModal(true)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Gestão de Usuários</h1>
            <p className="text-sm text-text-secondary">
              Gerencie os usuários do sistema
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
          Novo Usuário
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-accent-purple/5 border-accent-purple/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-accent-purple flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">
                Controle de Acesso (RBAC)
              </p>
              <ul className="text-xs text-text-secondary space-y-1">
                <li><strong>Administrador:</strong> Acesso total ao sistema</li>
                <li><strong>Editor:</strong> Pode criar e editar vídeos</li>
                <li><strong>Visualizador:</strong> Apenas visualiza o conteúdo</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>{users.length} usuário(s) no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
            </div>
          ) : error ? (
            <div className="p-4 bg-status-error/10 border border-status-error/30 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-status-error" />
              <p className="text-sm text-status-error">{error}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border transition-all ${
                    !user.ativo
                      ? 'border-status-error/20 bg-status-error/5 opacity-60'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        user.role === 'admin'
                          ? 'bg-accent-purple/20'
                          : user.role === 'editor'
                          ? 'bg-accent-blue/20'
                          : 'bg-white/10'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield className="w-6 h-6 text-accent-purple" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-text-secondary" />
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-text-primary">{user.nome}</p>
                          <span className={`px-2 py-0.5 text-xs rounded ${ROLE_LABELS[user.role].color}`}>
                            {ROLE_LABELS[user.role].label}
                          </span>
                          {user.primeiroAcesso && (
                            <span className="px-2 py-0.5 text-xs bg-status-warning/20 text-status-warning rounded">
                              Primeiro Acesso
                            </span>
                          )}
                          {!user.ativo && (
                            <span className="px-2 py-0.5 text-xs bg-status-error/20 text-status-error rounded">
                              Desativado
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Criado: {formatDate(user.criadoEm)}
                          </span>
                          {user.ultimoLogin && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Último login: {formatDate(user.ultimoLogin)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Toggle Active */}
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title={user.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {user.ativo ? (
                            <ToggleRight className="w-5 h-5 text-status-success" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-text-secondary" />
                          )}
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Reset Password */}
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowResetPasswordModal(true)
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-status-warning transition-colors"
                        title="Resetar Senha"
                      >
                        <Key className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowDeleteModal(true)
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-status-error transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">Novo Usuário</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nome"
                  placeholder="Nome completo"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <div className="relative">
                  <Input
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-text-secondary hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Papel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['admin', 'editor', 'viewer'] as UserRole[]).map((role) => (
                      <button
                        key={role}
                        onClick={() => setFormData({ ...formData, role })}
                        className={`p-3 rounded-lg border text-sm transition-all ${
                          formData.role === role
                            ? 'border-accent-purple bg-accent-purple/10 text-text-primary'
                            : 'border-white/10 text-text-secondary hover:border-white/20'
                        }`}
                      >
                        {ROLE_LABELS[role].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={isSubmitting || !formData.nome || !formData.email || !formData.senha}
                  icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                >
                  Criar Usuário
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">Editar Usuário</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nome"
                  placeholder="Nome completo"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Papel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['admin', 'editor', 'viewer'] as UserRole[]).map((role) => (
                      <button
                        key={role}
                        onClick={() => setFormData({ ...formData, role })}
                        className={`p-3 rounded-lg border text-sm transition-all ${
                          formData.role === role
                            ? 'border-accent-purple bg-accent-purple/10 text-text-primary'
                            : 'border-white/10 text-text-secondary hover:border-white/20'
                        }`}
                      >
                        {ROLE_LABELS[role].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateUser}
                  disabled={isSubmitting || !formData.nome || !formData.email}
                  icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                >
                  Salvar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete User Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-status-error/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-status-error" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Deletar Usuário</h2>
                  <p className="text-sm text-text-secondary">Esta ação não pode ser desfeita</p>
                </div>
              </div>

              <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-xl mb-4">
                <p className="text-sm text-text-primary">
                  Tem certeza que deseja deletar o usuário <strong>{selectedUser.nome}</strong> ({selectedUser.email})?
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleDeleteUser}
                  disabled={isSubmitting}
                  className="bg-status-error hover:bg-status-error/90"
                  icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                >
                  Deletar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetPasswordModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowResetPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-status-warning" />
                  <h2 className="text-lg font-bold text-text-primary">Resetar Senha</h2>
                </div>
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-text-secondary mb-4">
                Definir nova senha para <strong>{selectedUser.nome}</strong>
              </p>

              <div className="relative">
                <Input
                  label="Nova Senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3 bg-status-warning/10 border border-status-warning/20 rounded-lg mt-4">
                <p className="text-xs text-status-warning">
                  O usuário será obrigado a trocar a senha no próximo login.
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={() => setShowResetPasswordModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={isSubmitting || newPassword.length < 6}
                  icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                >
                  Resetar Senha
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
