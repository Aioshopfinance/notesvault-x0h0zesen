import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { subDays, isAfter } from 'date-fns'
import { Search, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'
import { ScanCard } from '@/components/ScanCard'
import type { ScanItem } from '@/lib/scanners/scan.types'

export default function MeusScans() {
  const navigate = useNavigate()
  const [scans, setScans] = useState<ScanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')

  const [scanToDelete, setScanToDelete] = useState<ScanItem | null>(null)
  const [scanToRename, setScanToRename] = useState<ScanItem | null>(null)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    loadScans()
  }, [])

  const loadScans = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setScans((data as ScanItem[]) || [])
    } catch (error) {
      console.error('Erro ao buscar scans:', error)
      toast.error('Erro ao carregar seus scans.')
    } finally {
      setLoading(false)
    }
  }

  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      const query = searchQuery.toLowerCase()
      const nameMatch = (scan.display_name || scan.file_name || '').toLowerCase().includes(query)
      const textMatch = (scan.extracted_text || '').toLowerCase().includes(query)
      const matchesSearch = nameMatch || textMatch

      let matchesDate = true
      if (dateFilter === '7days') {
        matchesDate = isAfter(new Date(scan.created_at), subDays(new Date(), 7))
      } else if (dateFilter === '30days') {
        matchesDate = isAfter(new Date(scan.created_at), subDays(new Date(), 30))
      }

      return matchesSearch && matchesDate
    })
  }, [scans, searchQuery, dateFilter])

  const handleDelete = async () => {
    if (!scanToDelete) return
    try {
      if (scanToDelete.image_url && scanToDelete.image_url.includes('/storage/v1/object/public/')) {
        const urlParts = scanToDelete.image_url.split('/storage/v1/object/public/')
        if (urlParts.length === 2) {
          const pathParts = urlParts[1].split('/')
          const bucket = pathParts[0]
          const path = pathParts.slice(1).join('/')
          await supabase.storage.from(bucket).remove([path])
        }
      }

      const { error } = await supabase.from('scans').delete().eq('id', scanToDelete.id)
      if (error) throw error

      setScans((prev) => prev.filter((s) => s.id !== scanToDelete.id))
      toast.success('Scan excluído com sucesso')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir o scan')
    } finally {
      setScanToDelete(null)
    }
  }

  const handleRename = async () => {
    if (!scanToRename) return
    if (!newName.trim()) {
      toast.error('O nome não pode estar vazio')
      return
    }

    try {
      const { error } = await supabase
        .from('scans')
        .update({ display_name: newName.trim() })
        .eq('id', scanToRename.id)

      if (error) throw error

      setScans((prev) =>
        prev.map((s) => (s.id === scanToRename.id ? { ...s, display_name: newName.trim() } : s)),
      )
      toast.success('Scan renomeado com sucesso')
    } catch (error) {
      console.error('Erro ao renomear:', error)
      toast.error('Erro ao renomear o scan')
    } finally {
      setScanToRename(null)
    }
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Scans</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus documentos digitalizados e textos extraídos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou texto..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background">
              <SelectValue placeholder="Filtrar por data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden border rounded-xl bg-card">
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-4">
                <Skeleton className="h-4 w-3/4 mb-3" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <Skeleton className="h-10 w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-muted/10 border-dashed">
          <div className="bg-muted p-4 rounded-full mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum scan encontrado</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            {searchQuery || dateFilter !== 'all'
              ? 'Nenhum documento corresponde aos filtros atuais. Tente limpar sua busca.'
              : 'Você ainda não possui nenhum documento digitalizado.'}
          </p>
          {(searchQuery || dateFilter !== 'all') && (
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSearchQuery('')
                setDateFilter('all')
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredScans.map((scan) => (
            <ScanCard
              key={scan.id}
              scan={scan}
              onClick={(s) => navigate('/scanner', { state: { scan: s } })}
              onRename={(s) => {
                setScanToRename(s)
                setNewName(s.display_name || s.file_name || '')
              }}
              onDelete={(s) => setScanToDelete(s)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!scanToDelete} onOpenChange={(open) => !open && setScanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita. O documento e sua imagem serão removidos
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!scanToRename} onOpenChange={(open) => !open && setScanToRename(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear documento</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name" className="sr-only">
              Nome
            </Label>
            <Input
              id="name"
              placeholder="Digite o novo nome..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScanToRename(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRename}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
