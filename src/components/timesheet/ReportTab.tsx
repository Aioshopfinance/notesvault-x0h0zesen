import { useState, useMemo } from 'react'
import { useTimesheetContext } from './TimesheetContext'
import { printPage } from './utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Printer, FileDown, CheckCircle } from 'lucide-react'

export default function ReportTab() {
  const { rows, markAsPaid } = useTimesheetContext()
  const [clientFilter, setClientFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const uniqueClients = useMemo(
    () => Array.from(new Set(rows.map((r) => r.client).filter(Boolean))),
    [rows],
  )

  const reportData = useMemo(() => {
    const grouped: Record<
      string,
      { client: string; status: string; hours: number; value: number }
    > = {}

    rows.forEach((r) => {
      const c = r.client || 'Sem cliente'
      const s = r.status
      const key = `${c}-${s}`
      if (!grouped[key]) grouped[key] = { client: c, status: s, hours: 0, value: 0 }
      grouped[key].hours += r.wh
      grouped[key].value += r.dt
    })

    let result = Object.values(grouped)
    if (clientFilter !== 'all') result = result.filter((x) => x.client === clientFilter)
    if (statusFilter !== 'all') result = result.filter((x) => x.status === statusFilter)

    return result.sort((a, b) => a.client.localeCompare(b.client))
  }, [rows, clientFilter, statusFilter])

  const totalPendente = reportData
    .filter((x) => x.status === 'Pendente')
    .reduce((acc, x) => acc + x.value, 0)
  const totalPago = reportData
    .filter((x) => x.status === 'Pago')
    .reduce((acc, x) => acc + x.value, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 print:hidden items-end">
        <div className="space-y-1 w-full md:w-64">
          <label className="text-xs font-medium">Cliente</label>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueClients.map((c: any) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 w-full md:w-64">
          <label className="text-xs font-medium">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <Button variant="outline" className="gap-2" onClick={printPage}>
          <Printer className="w-4 h-4" /> Imprimir
        </Button>
        <Button variant="outline" className="gap-2" onClick={printPage}>
          <FileDown className="w-4 h-4" /> Exportar PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20">
          <div className="text-sm font-medium mb-1">Total Pendente</div>
          <div className="text-2xl font-bold">R$ {totalPendente.toFixed(2)}</div>
        </div>
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-xl border border-green-500/20">
          <div className="text-sm font-medium mb-1">Total Pago</div>
          <div className="text-2xl font-bold">R$ {totalPago.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden print:border-none">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Horas Totais</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-center print:hidden">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum dado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              reportData.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.client}</TableCell>
                  <TableCell className="text-right">{row.hours.toFixed(2)}h</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={row.status === 'Pago' ? 'default' : 'secondary'}
                      className={row.status === 'Pago' ? 'bg-green-500' : ''}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">R$ {row.value.toFixed(2)}</TableCell>
                  <TableCell className="text-center print:hidden">
                    {row.status === 'Pendente' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => markAsPaid(row.client)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar como Pago
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {reportData.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Total Geral</TableCell>
                <TableCell className="text-right font-bold">
                  {reportData.reduce((a, b) => a + b.hours, 0).toFixed(2)}h
                </TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right font-bold text-lg">
                  R$ {reportData.reduce((a, b) => a + b.value, 0).toFixed(2)}
                </TableCell>
                <TableCell className="print:hidden"></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  )
}
