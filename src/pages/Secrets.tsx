import { useState, useEffect, useRef } from 'react'
import {
  KeyRound,
  Eye,
  EyeOff,
  Plus,
  ShieldAlert,
  Copy,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import useSecretsStore, { AppSecret } from '@/stores/useSecretsStore'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export default function Secrets() {
  const { secrets, addSecret, updateSecret, deleteSecret, logAudit } = useSecretsStore()
  const { toast } = useToast()
  const { user } = useAuth()

  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const unlockTimersRef = useRef<Record<string, NodeJS.Timeout>>({})

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'API Key',
    value: '',
  })
  const [secretToDelete, setSecretToDelete] = useState<AppSecret | null>(null)

  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false)
  const [unlockingSecret, setUnlockingSecret] = useState<AppSecret | null>(null)
  const [masterPasswordInput, setMasterPasswordInput] = useState('')
  const [masterPasswordLoading, setMasterPasswordLoading] = useState(false)

  useEffect(() => {
    return () => {
      Object.values(unlockTimersRef.current).forEach(clearTimeout)
    }
  }, [])

  const isSecretUnlocked = (secretId: string) => !!unlocked[secretId]

  const lockSecret = (secret: AppSecret) => {
    if (unlockTimersRef.current[secret.id]) {
      clearTimeout(unlockTimersRef.current[secret.id])
    }

    setUnlocked((prev) => ({ ...prev, [secret.id]: false }))
    setRevealed((prev) => ({ ...prev, [secret.id]: false }))

    logAudit({
      action: 'Bloqueio',
      secretName: secret.name,
      status: 'Sucesso',
    })
  }

  const unlockSecret = (secret: AppSecret) => {
    setUnlocked((prev) => ({ ...prev, [secret.id]: true }))

    logAudit({
      action: 'Desbloqueio',
      secretName: secret.name,
      status: 'Sucesso',
    })

    if (unlockTimersRef.current[secret.id]) {
      clearTimeout(unlockTimersRef.current[secret.id])
    }

    unlockTimersRef.current[secret.id] = setTimeout(() => {
      setUnlocked((prev) => ({ ...prev, [secret.id]: false }))
      setRevealed((prev) => ({ ...prev, [secret.id]: false }))

      logAudit({
        action: 'Bloqueio Automático',
        secretName: secret.name,
        status: 'Sucesso',
      })
    }, 15000)
  }

  const openUnlockDialog = (secret: AppSecret) => {
    setUnlockingSecret(secret)
    setMasterPasswordInput('')
    setIsUnlockDialogOpen(true)
  }

  const handleConfirmUnlock = async () => {
    if (!user?.id) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login novamente para continuar.',
        variant: 'destructive',
      })
      return
    }

    if (!unlockingSecret) return

    if (!masterPasswordInput.trim()) {
      toast({
        title: 'Senha obrigatória',
        description: 'Digite sua senha mestre para desbloquear.',
        variant: 'destructive',
      })
      return
    }

    setMasterPasswordLoading(true)

    try {
      const { data, error } = await (supabase as any)
        .from('user_preferences')
        .select('master_password')
        .eq('id', user.id)
        .single()

      if (error) throw error

      const savedMasterPassword = data?.master_password

      if (!savedMasterPassword) {
        toast({
          title: 'Senha mestre não configurada',
          description: 'Cadastre sua senha mestre em Configurações antes de desbloquear secrets.',
          variant: 'destructive',
        })
        return
      }

      if (masterPasswordInput !== savedMasterPassword) {
        logAudit({
          action: 'Tentativa de Desbloqueio',
          secretName: unlockingSecret.name,
          status: 'Falha',
        })

        toast({
          title: 'Senha mestre incorreta',
          description: 'A senha digitada não confere.',
          variant: 'destructive',
        })
        return
      }

      unlockSecret(unlockingSecret)
      setIsUnlockDialogOpen(false)
      setUnlockingSecret(null)
      setMasterPasswordInput('')

      toast({
        title: 'Secret desbloqueada',
        description: 'Acesso liberado por 15 segundos.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao validar senha mestre',
        description: error?.message || 'Não foi possível validar a senha mestre.',
        variant: 'destructive',
      })
    } finally {
      setMasterPasswordLoading(false)
    }
  }

  const toggleLock = (secret: AppSecret) => {
    if (isSecretUnlocked(secret.id)) {
      lockSecret(secret)
    } else {
      openUnlockDialog(secret)
    }
  }

  const toggleReveal = (secret: AppSecret) => {
    if (!isSecretUnlocked(secret.id)) {
      toast({
        title: 'Secret protegida',
        description: 'Desbloqueie o cadeado antes de visualizar o valor.',
        variant: 'destructive',
      })
      return
    }

    const isNowRevealed = !revealed[secret.id]

    setRevealed((prev) => ({ ...prev, [secret.id]: isNowRevealed }))

    logAudit({
      action: isNowRevealed ? 'Visualização' : 'Ocultação',
      secretName: secret.name,
      status: 'Sucesso',
    })
  }

  const handleCopy = async (secret: AppSecret) => {
    if (!isSecretUnlocked(secret.id)) {
      toast({
        title: 'Secret protegida',
        description: 'Desbloqueie o cadeado antes de copiar.',
        variant: 'destructive',
      })
      return
    }

    try {
      await navigator.clipboard.writeText(secret.value)

      toast({
        title: 'Copiado!',
        description: 'Secret copiada para a área de transferência.',
      })

      logAudit({
        action: 'Cópia',
        secretName: secret.name,
        status: 'Sucesso',
      })
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar a secret.',
        variant: 'destructive',
      })
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormData({ name: '', type: 'API Key', value: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (secret: AppSecret) => {
    if (!isSecretUnlocked(secret.id)) {
      toast({
        title: 'Secret protegida',
        description: 'Desbloqueie o cadeado antes de editar.',
        variant: 'destructive',
      })
      return
    }

    setEditingId(secret.id)
    setFormData({ name: secret.name, type: secret.type, value: secret.value })
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.value) {
      toast({
        title: 'Erro',
        description: 'Nome e valor são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    if (editingId) {
      updateSecret(editingId, {
        name: formData.name,
        type: formData.type,
        value: formData.value,
      })

      logAudit({
        action: 'Edição',
        secretName: formData.name,
        status: 'Sucesso',
      })

      toast({ title: 'Secret atualizada com sucesso' })
    } else {
      addSecret({
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        value: formData.value,
        createdAt: new Date().toISOString(),
      })

      logAudit({
        action: 'Criação',
        secretName: formData.name,
        status: 'Sucesso',
      })

      toast({ title: 'Secret armazenada com segurança' })
    }

    setIsModalOpen(false)
  }

  const handleDelete = () => {
    if (secretToDelete) {
      deleteSecret(secretToDelete.id)

      logAudit({
        action: 'Exclusão',
        secretName: secretToDelete.name,
        status: 'Sucesso',
      })

      toast({ title: 'Secret deletada' })
      setSecretToDelete(null)
    }
  }

  const askDelete = (secret: AppSecret) => {
    if (!isSecretUnlocked(secret.id)) {
      toast({
        title: 'Secret protegida',
        description: 'Desbloqueie o cadeado antes de excluir.',
        variant: 'destructive',
      })
      return
    }

    setSecretToDelete(secret)
  }

  const maskValue = (val: string) => {
    if (!val) return '••••'
    if (val.length <= 4) return '••••'
    return '•'.repeat(12) + val.slice(-4)
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <KeyRound className="w-8 h-8 text-primary" />
              Gerenciador de Secrets
            </h2>

            <p className="text-muted-foreground mt-1 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Cofre criptografado para dados sensíveis.
            </p>

            <p className="text-xs text-amber-500 mt-2">
              🔒 Para usar ações como copiar, editar ou excluir, primeiro desbloqueie o cadeado da linha.
            </p>
          </div>

          <Button onClick={openAddModal} className="shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Secret
          </Button>
        </div>

        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {secrets.map((secret) => {
                const isUnlocked = isSecretUnlocked(secret.id)
                const isRevealed = !!revealed[secret.id]

                return (
                  <TableRow key={secret.id}>
                    <TableCell className="font-medium">{secret.name}</TableCell>

                    <TableCell>
                      <Badge variant="outline">{secret.type}</Badge>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(secret.createdAt))}
                    </TableCell>

                    <TableCell className="font-mono text-sm text-muted-foreground break-all">
                      {isUnlocked && isRevealed ? secret.value : maskValue(secret.value)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleLock(secret)}
                              className={
                                isUnlocked
                                  ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                  : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                              }
                            >
                              {isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isUnlocked ? 'Bloquear linha' : 'Desbloquear linha'}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopy(secret)}
                                disabled={!isUnlocked}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isUnlocked ? 'Copiar' : 'Desbloqueie para copiar'}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleReveal(secret)}
                                disabled={!isUnlocked}
                                className={
                                  isUnlocked && isRevealed
                                    ? 'text-destructive hover:text-destructive/90 hover:bg-destructive/10'
                                    : ''
                                }
                              >
                                {isUnlocked && isRevealed ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {!isUnlocked
                              ? 'Desbloqueie para visualizar'
                              : isRevealed
                              ? 'Ocultar valor'
                              : 'Visualizar valor'}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(secret)}
                                disabled={!isUnlocked}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isUnlocked ? 'Editar' : 'Desbloqueie para editar'}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => askDelete(secret)}
                                disabled={!isUnlocked}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isUnlocked ? 'Deletar' : 'Desbloqueie para excluir'}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}

              {secrets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma secret cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Secret' : 'Nova Secret'}</DialogTitle>
            <DialogDescription>
              Armazene chaves de API, senhas ou tokens com segurança.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nome identificador</label>
              <Input
                placeholder="ex: Produção AWS"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="API Key">API Key</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Login">Login</SelectItem>
                  <SelectItem value="Token">Token</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Valor Secreto</label>
              <Textarea
                placeholder="Insira o valor..."
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="font-mono min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Salvar Alterações' : 'Salvar Secret'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desbloquear Secret</DialogTitle>
            <DialogDescription>
              Digite sua senha mestre para liberar o acesso temporário a esta secret.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Senha Mestre</label>
              <Input
                type="password"
                placeholder="Digite sua senha mestre"
                value={masterPasswordInput}
                onChange={(e) => setMasterPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleConfirmUnlock()
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUnlockDialogOpen(false)
                setUnlockingSecret(null)
                setMasterPasswordInput('')
              }}
              disabled={masterPasswordLoading}
            >
              Cancelar
            </Button>

            <Button onClick={handleConfirmUnlock} disabled={masterPasswordLoading}>
              {masterPasswordLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Desbloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!secretToDelete}
        onOpenChange={(open) => !open && setSecretToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá permanentemente a secret "
              {secretToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
