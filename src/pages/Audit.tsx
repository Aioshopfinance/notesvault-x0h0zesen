import { useState, useEffect } from 'react'
import {
  Activity,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FilterX,
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
import { supabase } from '@/lib/supabase/client'

const actionMap: Record<string, string> = {
  view: 'Visualizou',
  copy: 'Copiou',
  create: 'Criou',
  update: 'Atualizou',
  delete: 'Excluiu',
}

export default function Audit() {
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

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      const from = (page - 1) * itemsPerPage
      let query: any = supabase
        .from('secret_access_logs')
        .select(`id, action, timestamp, secrets!inner(name)`, { count: 'exact' })
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
      setLoading(false)
    }
    fetchLogs()
  }, [page, action, startDate, endDate, search])

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
                      className={loading ? 'opacity-50 transition-opacity' : 'transition-opacity'}
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
      </div>
    </div>
  )
}
