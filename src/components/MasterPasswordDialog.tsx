import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
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
import useNotesStore from '@/stores/useNotesStore'
import { useToast } from '@/hooks/use-toast'

interface MasterPasswordDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (password: string) => void
  onFail?: () => void
  title?: string
  description?: string
}

export function MasterPasswordDialog({
  open,
  onClose,
  onSuccess,
  onFail,
  title = 'Desbloquear',
  description = 'Digite sua senha mestre para liberar o acesso.',
}: MasterPasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { verifyMasterPassword } = useNotesStore()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setPassword('')
    }
  }, [open])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

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
      const isValid = await verifyMasterPassword(password)

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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Senha Mestre</label>
            <Input
              type="password"
              placeholder="Digite sua senha mestre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
