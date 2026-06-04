import { useState, useEffect } from 'react'
import { Loader2, Copy, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

interface MasterPasswordDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (password: string) => void
  onFail?: () => void
  title?: string
  description?: string
}

import { hashText, verifyText, generateRecoveryKey } from '@/lib/crypto'

export function MasterPasswordDialog({
  open,
  onClose,
  onSuccess,
  onFail,
  title = 'Desbloquear',
  description = 'Digite sua senha mestre para liberar o acesso.',
}: MasterPasswordDialogProps) {
  const [mode, setMode] = useState<'loading' | 'unlock' | 'setup'>('loading')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [recoveryKey, setRecoveryKey] = useState('')
  const [confirmedSafekeeping, setConfirmedSafekeeping] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setPassword('')
      setConfirmedSafekeeping(false)
      checkStatus()
    }
  }, [open])

  const checkStatus = async () => {
    setMode('loading')
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        onClose()
        return
      }
      const { data } = await supabase
        .from('user_preferences')
        .select('master_password_hash, master_password')
        .eq('id', user.id)
        .single()

      if (data?.master_password_hash || data?.master_password) {
        setMode('unlock')
      } else {
        setRecoveryKey(generateRecoveryKey())
        setMode('setup')
      }
    } catch (err) {
      setMode('unlock')
    }
  }

  const logSecurityEvent = async (action: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('secret_access_logs').insert({
      user_id: user.id,
      action,
      details: { action_context: 'master_password_security' },
    })
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      toast({ title: 'Senha obrigatória', variant: 'destructive' })
      return
    }
    if (!confirmedSafekeeping) {
      toast({
        title: 'Confirmação necessária',
        description: 'Você deve confirmar que guardou a chave de recuperação.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const passwordHash = await hashText(password)
      const recoveryHash = await hashText(recoveryKey)

      const { error } = await supabase
        .from('user_preferences')
        .update({
          master_password_hash: passwordHash,
          recovery_key_hash: recoveryHash,
          recovery_key_created_at: new Date().toISOString(),
          master_password: null,
        })
        .eq('id', user.id)

      if (error) throw error

      await logSecurityEvent('master_password_created')
      await logSecurityEvent('recovery_key_generated')

      toast({
        title: 'Senha configurada',
        description: 'Sua senha mestre foi configurada com sucesso.',
      })

      onSuccess(password)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      toast({
        title: 'Senha obrigatória',
        description: 'Digite sua senha mestre para desbloquear.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data } = await supabase
        .from('user_preferences')
        .select('master_password_hash, master_password')
        .eq('id', user.id)
        .single()

      let isValid = false
      if (data?.master_password_hash) {
        isValid = await verifyText(password, data.master_password_hash)
      } else if (data?.master_password) {
        isValid = await verifyText(password, data.master_password)
        if (isValid) {
          const hash = await hashText(password)
          await supabase
            .from('user_preferences')
            .update({ master_password_hash: hash, master_password: null })
            .eq('id', user.id)
        }
      }

      if (isValid) {
        onSuccess(password)
      } else {
        if (onFail) onFail()
        toast({
          title: 'Senha incorreta',
          description: 'A senha mestre informada não confere.',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Erro na validação',
        description: error?.message || 'Não foi possível validar a senha mestre.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'setup' ? 'Configurar Senha Mestre' : title}</DialogTitle>
          <DialogDescription>
            {mode === 'setup' ? 'Sua senha mestre protege todos os seus dados.' : description}
          </DialogDescription>
        </DialogHeader>

        {mode === 'loading' && (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {mode === 'setup' && (
          <form onSubmit={handleSetup} className="space-y-4 py-4">
            <div className="space-y-4">
              <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Atenção</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Crie uma senha mestre forte e única.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nova Senha Mestre</label>
                <Input
                  type="password"
                  placeholder="Digite uma senha forte"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <label className="text-sm font-medium">Chave de Recuperação</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Guarde sua chave de recuperação em local seguro. Ela será necessária caso você
                  esqueça sua senha mestra. Por segurança, o NotesVault não poderá mostrar essa
                  chave novamente.
                </p>
                <div className="flex gap-2">
                  <Input value={recoveryKey} readOnly className="font-mono text-center bg-muted" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(recoveryKey)
                      toast({ title: 'Copiado!', description: 'Chave de recuperação copiada.' })
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="confirm-safekeeping"
                  checked={confirmedSafekeeping}
                  onCheckedChange={(checked) => setConfirmedSafekeeping(checked as boolean)}
                />
                <label
                  htmlFor="confirm-safekeeping"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Entendo que preciso guardar minha chave de recuperação.
                </label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !confirmedSafekeeping || !password}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar e Continuar
              </Button>
            </DialogFooter>
          </form>
        )}

        {mode === 'unlock' && (
          <form onSubmit={handleUnlock} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha Mestre</label>
              <Input
                type="password"
                placeholder="Digite sua senha mestre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <div className="text-right mt-1">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    toast({
                      title: 'Recuperação de Senha',
                      description:
                        'Em breve você poderá redefinir sua senha mestra usando sua chave de recuperação.',
                    })
                  }}
                >
                  Esqueci minha senha mestra
                </button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !password}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
