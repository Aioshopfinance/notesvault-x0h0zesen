import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Unlock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface NoteUnlockDialogProps {
  isOpen: boolean
  onCancel: () => void
  correctPassword?: string | null
  onUnlock: () => void
}

export function NoteUnlockDialog({
  isOpen,
  onCancel,
  correctPassword,
  onUnlock,
}: NoteUnlockDialogProps) {
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === correctPassword) {
      onUnlock()
      setPassword('')
    } else {
      toast({ title: 'Senha incorreta', variant: 'destructive' })
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nota Bloqueada</DialogTitle>
          <DialogDescription>Digite a senha para visualizar e editar esta nota.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              <Unlock className="w-4 h-4 mr-2" /> Desbloquear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
