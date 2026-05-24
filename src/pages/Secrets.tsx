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
import { ScrollArea } from '@/components/ui/scroll-area'
import { MasterPasswordDialog } from '@/components/MasterPasswordDialog'
import useSecretsStore, { AppSecret } from '@/stores/useSecretsStore'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

export default function Secrets() {
  const { secrets, loading, fetchSecrets, addSecret, updateSecret, deleteSecret, logAudit } =
    useSecretsStore()
  const { toast } = useToast()
  const { user } = useAuth()

  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const unlockTimersRef = useRef<Record<string, NodeJS.Timeout>>({})

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Login/Senha',
    value: '',
    platform: '',
    url: '',
    username: '',
    environment: 'Pessoal',
    passwordOrigin: 'Criada manualmente',
    recoveryPhrase: '',
    notes: '',
  })
  const [secretToDelete, setSecretToDelete] = useState<AppSecret | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false)
  const [unlockingSecret, setUnlockingSecret] = useState<AppSecret | null>(null)

  useEffect(() => {
    fetchSecrets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  }

  const unlockSecret = async (secret: AppSecret) => {
    setUnlocked((prev) => ({ ...prev, [secret.id]: true }))

    await logAudit('view', secret.id, {
      secret_name: secret.name,
      platform: secret.platform,
      username: secret.username,
      environment: secret.environment,
      category: secret.type,
    })

    if (unlockTimersRef.current[secret.id]) {
      clearTimeout(unlockTimersRef.current[secret.id])
    }

    unlockTimersRef.current[secret.id] = setTimeout(() => {
      setUnlocked((prev) => ({ ...prev, [secret.id]: false }))
      setRevealed((prev) => ({ ...prev, [secret.id]: false }))
    }, 15000)
  }

  const openUnlockDialog = (secret: AppSecret) => {
    setUnlockingSecret(secret)
    setIsUnlockDialogOpen(true)
  }

  const handleSuccessUnlock = async () => {
    if (!user?.id) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login novamente para continuar.',
        variant: 'destructive',
      })
      return
    }

    if (!unlockingSecret) return

    await unlockSecret(unlockingSecret)
    setIsUnlockDialogOpen(false)
    setUnlockingSecret(null)

    toast({
      title: 'Secret desbloqueada',
      description: 'Acesso liberado por 15 segundos.',
    })
  }

  const handleFailUnlock = () => {
    // Only handling failures inside the component gracefully
  }

  const toggleLock = async (secret: AppSecret) => {
    if (!isSecretUnlocked(secret.id)) {
      openUnlockDialog(secret)
    } else {
      lockSecret(secret)
    }
  }

  const toggleReveal = async (secret: AppSecret) => {
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

    if (isNowRevealed) {
      await logAudit('view', secret.id, {
        secret_name: secret.name,
        platform: secret.platform,
        username: secret.username,
        environment: secret.environment,
        category: secret.type,
      })
    }
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
      await logAudit('copy', secret.id, {
        secret_name: secret.name,
        platform: secret.platform,
        username: secret.username,
        environment: secret.environment,
        category: secret.type,
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
    setFormData({
      name: '',
      type: 'Login/Senha',
      value: '',
      platform: '',
      url: '',
      username: '',
      environment: 'Pessoal',
      passwordOrigin: 'Criada manualmente',
      recoveryPhrase: '',
      notes: '',
    })
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
    setFormData({
      name: secret.name,
      type: secret.type,
      value: secret.value,
      platform: secret.platform || '',
      url: secret.url || '',
      username: secret.username || '',
      environment: secret.environment || 'Pessoal',
      passwordOrigin: secret.passwordOrigin || 'Criada manualmente',
      recoveryPhrase: secret.recoveryPhrase || '',
      notes: secret.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.value) {
      toast({
        title: 'Erro',
        description: 'Nome e valor são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      if (editingId) {
        await updateSecret(editingId, {
          name: formData.name,
          type: formData.type,
          value: formData.value,
          platform: formData.platform,
          url: formData.url,
          username: formData.username,
          environment: formData.environment,
          passwordOrigin: formData.passwordOrigin,
          recoveryPhrase: formData.recoveryPhrase,
          notes: formData.notes,
        })
        await logAudit('update', editingId, {
          secret_name: formData.name,
          platform: formData.platform,
          username: formData.username,
          environment: formData.environment,
          category: formData.type,
        })
        toast({ title: 'Secret atualizada com sucesso' })
      } else {
        const newSecret = await addSecret({
          name: formData.name,
          type: formData.type,
          value: formData.value,
          platform: formData.platform,
          url: formData.url,
          username: formData.username,
          environment: formData.environment,
          passwordOrigin: formData.passwordOrigin,
          recoveryPhrase: formData.recoveryPhrase,
          notes: formData.notes,
        })
        await logAudit('create', newSecret.id, {
          secret_name: newSecret.name,
          platform: newSecret.platform,
          username: newSecret.username,
          environment: newSecret.environment,
          category: newSecret.type,
        })
        toast({ title: 'Secret armazenada com segurança' })
      }

      setIsModalOpen(false)
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Falha ao processar a operação no servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (secretToDelete) {
      setIsDeleting(true)
      try {
        await logAudit('delete', secretToDelete.id, {
          secret_name: secretToDelete.name,
          platform: secretToDelete.platform,
          username: secretToDelete.username,
          environment: secretToDelete.environment,
          category: secretToDelete.type,
        })
        await deleteSecret(secretToDelete.id)

        toast({ title: 'Secret deletada' })
        setSecretToDelete(null)
      } catch (error: any) {
        toast({
          title: 'Erro ao deletar',
          description: error.message || 'Falha ao remover a secret do servidor.',
          variant: 'destructive',
        })
      } finally {
        setIsDeleting(false)
      }
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
      <div className="max-w-[1400px] mx-auto">
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
              🔒 Para usar ações como copiar, editar ou excluir, primeiro desbloqueie o cadeado da
              linha.
            </p>
          </div>

          <Button onClick={openAddModal} className="shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Secret
          </Button>
        </div>

        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap">Nome</TableHead>
                  <TableHead className="whitespace-nowrap">Plataforma</TableHead>
                  <TableHead className="whitespace-nowrap">Usuário</TableHead>
                  <TableHead className="whitespace-nowrap">Tipo</TableHead>
                  <TableHead className="whitespace-nowrap">Ambiente</TableHead>
                  <TableHead className="whitespace-nowrap">Valor</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading && secrets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Carregando secrets...
                    </TableCell>
                  </TableRow>
                ) : secrets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma secret cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  secrets.map((secret) => {
                    const isUnlocked = isSecretUnlocked(secret.id)
                    const isRevealed = !!revealed[secret.id]

                    return (
                      <TableRow key={secret.id}>
                        <TableCell className="font-medium">{secret.name}</TableCell>

                        <TableCell className="text-muted-foreground">
                          {secret.platform || '-'}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {secret.username || '-'}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {secret.type}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {secret.environment || '-'}
                        </TableCell>

                        <TableCell className="font-mono text-sm text-muted-foreground break-all min-w-[120px]">
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
                                  {isUnlocked ? (
                                    <Unlock className="w-4 h-4" />
                                  ) : (
                                    <Lock className="w-4 h-4" />
                                  )}
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
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(val) => !isSaving && setIsModalOpen(val)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Secret' : 'Nova Secret'}</DialogTitle>
            <DialogDescription>
              Armazene chaves de API, senhas ou tokens com segurança.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4 -mr-4">
            <div className="grid gap-8 py-4">
              {/* Bloco 1: Identificação */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold border-b pb-2">Identificação</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Nome identificador</label>
                    <Input
                      placeholder="ex: Supabase NotesVault"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <Select
                      value={formData.type}
                      onValueChange={(val) => setFormData({ ...formData, type: val })}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Login/Senha">Login/Senha</SelectItem>
                        <SelectItem value="E-mail">E-mail</SelectItem>
                        <SelectItem value="API Key">API Key</SelectItem>
                        <SelectItem value="Token">Token</SelectItem>
                        <SelectItem value="Banco de Dados">Banco de Dados</SelectItem>
                        <SelectItem value="Servidor/SSH">Servidor/SSH</SelectItem>
                        <SelectItem value="Seed / Frase Secreta">Seed / Frase Secreta</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <label className="text-sm font-medium">Plataforma</label>
                    <Input
                      placeholder="ex: Supabase, AWS, Google"
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 2: Acesso */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold border-b pb-2">Acesso</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2 md:col-span-2">
                    <label className="text-sm font-medium">URL</label>
                    <Input
                      placeholder="ex: https://supabase.com/dashboard"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Usuário / E-mail</label>
                    <Input
                      placeholder="ex: user@example.com"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Valor (Secret)</label>
                    <Textarea
                      placeholder="Sua senha, chave ou token..."
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="font-mono min-h-[60px]"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 3: Contexto e Origem */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold border-b pb-2">Contexto e Origem</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Ambiente</label>
                    <Select
                      value={formData.environment}
                      onValueChange={(val) => setFormData({ ...formData, environment: val })}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pessoal">Pessoal</SelectItem>
                        <SelectItem value="Teste">Teste</SelectItem>
                        <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                        <SelectItem value="Produção">Produção</SelectItem>
                        <SelectItem value="Cliente">Cliente</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Origem da Senha</label>
                    <Select
                      value={formData.passwordOrigin}
                      onValueChange={(val) => setFormData({ ...formData, passwordOrigin: val })}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Criada manualmente">Criada manualmente</SelectItem>
                        <SelectItem value="Gerador do navegador">Gerador do navegador</SelectItem>
                        <SelectItem value="Gerador do Chrome">Gerador do Chrome</SelectItem>
                        <SelectItem value="Gerador do Safari">Gerador do Safari</SelectItem>
                        <SelectItem value="Gerador externo">Gerador externo</SelectItem>
                        <SelectItem value="Frase secreta">Frase secreta</SelectItem>
                        <SelectItem value="12 palavras secretas">12 palavras secretas</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <label className="text-sm font-medium">
                      Frase de Recuperação (Seed/Mnemonic)
                    </label>
                    <Textarea
                      placeholder="Insira as palavras secretas de recuperação..."
                      value={formData.recoveryPhrase}
                      onChange={(e) => setFormData({ ...formData, recoveryPhrase: e.target.value })}
                      className="font-mono min-h-[60px]"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <label className="text-sm font-medium">Notas adicionais</label>
                    <Textarea
                      placeholder="Informações adicionais sobre o acesso..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="min-h-[60px]"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-2 border-t pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? 'Salvar Alterações' : 'Salvar Secret'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MasterPasswordDialog
        open={isUnlockDialogOpen}
        onClose={() => {
          setIsUnlockDialogOpen(false)
          setUnlockingSecret(null)
        }}
        onSuccess={handleSuccessUnlock}
        onFail={handleFailUnlock}
        title="Desbloquear Secret"
        description="Digite sua senha mestre para liberar o acesso temporário a esta secret."
      />

      <AlertDialog
        open={!!secretToDelete}
        onOpenChange={(open) => !open && !isDeleting && setSecretToDelete(null)}
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
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
