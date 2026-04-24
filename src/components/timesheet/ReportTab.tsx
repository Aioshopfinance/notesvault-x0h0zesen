import { useState, useMemo } from 'react'
import { useTimesheetContext } from './TimesheetContext'
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
import { Printer, FileDown, CheckCircle, Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'

function EditableCell({ value, onSave }: { value: string; onSave: (val: string) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [val, setVal] = useState(value)

  const handleBlur = () => {
    setIsEditing(false)
    if (val !== value) {
      onSave(val)
    }
  }

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleBlur()
          if (e.key === 'Escape') {
            setVal(value)
            setIsEditing(false)
          }
        }}
        className="h-8 w-full min-w-[100px]"
      />
    )
  }

  return (
    <div className="flex items-center group gap-2">
      <span>{value}</span>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function ReportTab() {
  const { rows, markAsPaid, updateBulkRecords, formatCurrency } = useTimesheetContext()
  const [clientFilter, setClientFilter] = useState('all')

  const printBancoDeHoras = () => {
    const originalTitle = document.title
    document.title = 'NotesVault - Banco de Horas'

    setTimeout(() => {
      window.print()

      setTimeout(() => {
        document.title = originalTitle
      }, 1000)
    }, 100)
  }
  const [statusFilter, setStatusFilter] = useState('all')

  const uniqueClients = useMemo(
    () => Array.from(new Set(rows.map((r) => r.client).filter(Boolean))),
    [rows],
  )

  const reportData = useMemo(() => {
    const grouped: Record<
      string,
      {
        id: string
        client: string
        location: string
        status: string
        hours: number
        value: number
        ids: string[]
      }
    > = {}

    rows.forEach((r) => {
      const c = r.client || 'Sem cliente'
      const l = r.location || 'Sem local'
      const s = r.status
      const key = `${c}-${l}-${s}`
      if (!grouped[key])
        grouped[key] = { id: key, client: c, location: l, status: s, hours: 0, value: 0, ids: [] }
      grouped[key].hours += r.wh
      grouped[key].value += r.dt
      grouped[key].ids.push(r.id)
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
      <style>{`
        @media print {
          @page { margin: 0.5cm; }
          body, html {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          .overflow-x-auto, .overflow-hidden {
            overflow: visible !important;
            width: 100% !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            display: table !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          th, td {
            border: 1px solid black !important;
            padding: 4px !important;
            font-size: 10px !important;
            background-color: white !important;
            color: black !important;
          }
          td input, th input {
            font-size: 10px !important;
            color: black !important;
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            min-width: auto !important;
          }
        }
      `}</style>
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
        <Button variant="outline" className="gap-2" onClick={printBancoDeHoras}>
          <Printer className="w-4 h-4" /> Imprimir
        </Button>
        <Button variant="outline" className="gap-2" onClick={printBancoDeHoras}>
          <FileDown className="w-4 h-4" /> Exportar PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20">
          <div className="text-sm font-medium mb-1">Total Pendente</div>
          <div className="text-2xl font-bold">{formatCurrency(totalPendente)}</div>
        </div>
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-xl border border-green-500/20">
          <div className="text-sm font-medium mb-1">Total Pago</div>
          <div className="text-2xl font-bold">{formatCurrency(totalPago)}</div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden print:border-none">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="text-right">Horas Totais</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-center print:hidden">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum dado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              reportData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    <EditableCell
                      value={row.client}
                      onSave={(val) => updateBulkRecords(row.ids, 'client', val)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={row.location}
                      onSave={(val) => updateBulkRecords(row.ids, 'location', val)}
                    />
                  </TableCell>
                  <TableCell className="text-right">{row.hours.toFixed(2)}h</TableCell>
                  <TableCell className="text-center">
                    <Select
                      value={row.status}
                      onValueChange={(val) => {
                        if (val !== row.status) {
                          updateBulkRecords(row.ids, 'status', val)
                        }
                      }}
                    >
                      <SelectTrigger className="w-[120px] h-8 mx-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Pago">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(row.value)}
                  </TableCell>
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
                <TableCell colSpan={2} className="font-bold">
                  Total Geral
                </TableCell>
                <TableCell className="text-right font-bold">
                  {reportData.reduce((a, b) => a + b.hours, 0).toFixed(2)}h
                </TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {formatCurrency(reportData.reduce((a, b) => a + b.value, 0))}
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
