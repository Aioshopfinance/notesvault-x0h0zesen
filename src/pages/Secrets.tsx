import { useState } from 'react'
import { KeyRound, Eye, EyeOff, Plus, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import useSecretsStore from '@/stores/useSecretsStore'
import { useToast } from '@/hooks/use-toast'
import { Secret } from '@/lib/types'

export default function Secrets() {
  const { secrets, addSecret, logAudit } = useSecretsStore()
  const { toast } = useToast()

  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [isAddOpen, setIsAddOpen] = useState(false)

  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newCat, setNewCat] = useState('API Keys')

  const toggleReveal = (secret: Secret) => {
    const isNowRevealed = !revealed[secret.id]
    setRevealed((prev) => ({ ...prev, [secret.id]: isNowRevealed }))

    if (isNowRevealed) {
      logAudit({
        action: 'Visualização',
        secretName: secret.name,
        status: 'Sucesso',
      })
      toast({
        title: 'Secret revelada',
        description: 'Esta ação foi registrada no Log de Auditoria.',
        variant: 'destructive',
      })
    }
  }

  const handleAdd = () => {
    if (!newName || !newValue) return
    addSecret({
      id: Date.now().toString(),
      name: newName,
      value: newValue,
      category: newCat,
    })
    logAudit({
      action: 'Criação',
      secretName: newName,
      status: 'Sucesso',
    })
    setNewName('')
    setNewValue('')
    setIsAddOpen(false)
    toast({ title: 'Secret armazenada com segurança' })
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <KeyRound className="w-8 h-8 text-primary" /> Secrets Manager
            </h2>
            <p className="text-muted-foreground mt-1 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Cofre criptografado para dados sensíveis.
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Secret
          </Button>
        </div>

        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secrets.map((secret) => (
                <TableRow key={secret.id}>
                  <TableCell className="font-medium">{secret.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{secret.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {revealed[secret.id] ? secret.value : '••••••••••••••••'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleReveal(secret)}
                      className={
                        revealed[secret.id]
                          ? 'text-destructive hover:text-destructive/90 hover:bg-destructive/10'
                          : ''
                      }
                    >
                      {revealed[secret.id] ? (
                        <EyeOff className="w-4 h-4 mr-2" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      {revealed[secret.id] ? 'Ocultar' : 'Revelar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {secrets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhuma secret cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Secret</DialogTitle>
            <DialogDescription>
              Armazene chaves de API, senhas ou tokens com segurança.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nome identificador</label>
              <Input
                placeholder="ex: Produção AWS"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Categoria</label>
              <Input
                placeholder="ex: API Keys"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Valor Secreto</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd}>Salvar Secret</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
