import { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FilterX,
  Copy,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

const actionMap: Record<string, string> = {
  view: 'Visualizou',
  copy: 'Copiou',
  create: 'Criou',
  update: 'Atualizou',
  delete: 'Excluiu',
}

export default function Audit() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [action, setAction] = useState('all')
  const [search, setSearch] = useState('')
  const itemsPerPage = 10

  const [selectedLog, setSelectedLog] = useState<any>(null)

  const fetchLogs = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true)
      const from = (page - 1) * itemsPerPage
      let query: any = supabase
        .from('secret_access_logs')
        .select(`id, action, timestamp, ip_address, user_agent, details, secrets!inner(name)`, {
          count: 'exact',
        })
        .order('timestamp', { ascending: false })
        .range(from, from + itemsPerPage - 1)

      if (action !== 'all') query = query.eq('action', action)
      if (startDate) query = query.gte('timestamp', `${startDate}T00:00:00Z`)
      if (endDate) query = query.lte('timestamp', `${endDate}T23:59:59Z`)
      if (search) query = query.ilike('secrets.name', `%${search}%`)

      const { data, error: err, count } = await query
      if (err) setError('Não foi possível carregar o log de auditoria.')
      else {
        setLogs(data || [])
        setTotalCount(count || 0)
        setError(null)
      }
      if (showLoader) setLoading(false)
    },
    [page, action, startDate, endDate, search],
  )

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    const channel = supabase
      .channel('public:secret_access_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'secret_access_logs' },
        (payload) => {
          toast({
            title: 'Novo log registrado',
            description: 'Um novo registro de auditoria foi recebido em tempo real.',
          })
          fetchLogs(false)
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLogs, toast])

  const resetFilters = () => {
    setStartDate('')
    setEndDate('')
    setAction('all')
    setSearch('')
    setPage(1)
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" /> Log de Auditoria
          </h2>
          <p className="text-muted-foreground mt-1 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            Trilha de auditoria inalterável para acesso a dados sensíveis.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 bg-card p-4 rounded-xl border shadow-sm">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setPage(1)
            }}
            title="Data Inicial"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setPage(1)
            }}
            title="Data Final"
          />
          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Ações</SelectItem>
              <SelectItem value="view">Visualização</SelectItem>
              <SelectItem value="copy">Cópia</SelectItem>
              <SelectItem value="create">Criação</SelectItem>
              <SelectItem value="update">Atualização</SelectItem>
              <SelectItem value="delete">Deleção</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar por secret..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <Button variant="outline" onClick={resetFilters} className="flex gap-2">
            <FilterX className="w-4 h-4" /> Limpar
          </Button>
        </div>

        <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ação Realizada</TableHead>
                  <TableHead>Secret Afetada</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">Carregando logs...</p>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      Nenhum registro de auditoria encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                        loading ? 'opacity-50' : ''
                      }`}
                    >
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {actionMap[log.action] || log.action}
                      </TableCell>
                      <TableCell>{log.secrets?.name || 'Segredo removido'}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="default"
                          className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
                        >
                          Sucesso
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {logs.length > 0 ? (page - 1) * itemsPerPage + 1 : 0}-
              {Math.min(page * itemsPerPage, totalCount)} de {totalCount} registros
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * itemsPerPage >= totalCount || loading}
              >
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Auditoria</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4 text-sm mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                  <div>
                    <span className="font-semibold text-muted-foreground">Data/Hora:</span> <br />
                    {new Date(selectedLog.timestamp).toLocaleString('pt-BR')}
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Ação Realizada:</span>{' '}
                    <br />
                    {actionMap[selectedLog.action] || selectedLog.action}
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Usuário (Email):</span>{' '}
                    <br />
                    {user?.email || 'Desconhecido'}
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Secret Afetada:</span>{' '}
                    <br />
                    {selectedLog.secrets?.name || 'Segredo removido'}
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Endereço IP:</span> <br />
                    {selectedLog.ip_address || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">User Agent:</span> <br />
                    {selectedLog.user_agent || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2 mt-4">
                    <span className="font-semibold">Detalhes (JSON):</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedLog.details, null, 2))
                        toast({
                          title: 'Copiado!',
                          description: 'Detalhes copiados para a área de transferência.',
                        })
                      }}
                      className="flex gap-2"
                    >
                      <Copy className="w-4 h-4" /> Copiar Detalhes
                    </Button>
                  </div>
                  <pre className="bg-zinc-950 text-green-400 p-4 rounded-md overflow-auto max-h-60 text-xs border border-zinc-800">
                    {JSON.stringify(selectedLog.details, null, 2) || '{}'}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
