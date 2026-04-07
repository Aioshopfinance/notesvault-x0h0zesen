import { useState, useMemo } from 'react'
import { useTimesheetContext } from './TimesheetContext'
import { printPage } from './utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Printer, FileDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

const EditableCell = ({ value, type, onBlur, disabled, min, step }: any) => {
  const [val, setVal] = useState(value)
  return (
    <Input
      type={type}
      value={val}
      min={min}
      step={step}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val !== value) onBlur(val)
      }}
      disabled={disabled}
      className="h-8 w-full min-w-[70px] px-2 py-1 text-sm border-transparent hover:border-input focus:border-input bg-transparent shadow-none"
    />
  )
}

export default function RecordsTab() {
  const { rows, loading, addRecord, updateRecord } = useTimesheetContext()
  const [savingId, setSavingId] = useState<string | null>(null)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [clientFilter, setClientFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '18:00',
    break_time: 1,
    hourly_rate: 17,
    client: '',
    location: '',
    status: 'Pendente',
  })

  const uniqueClients = useMemo(
    () => Array.from(new Set(rows.map((r) => r.client).filter(Boolean))),
    [rows],
  )

  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        if (startDate && r.date < startDate) return false
        if (endDate && r.date > endDate) return false
        if (clientFilter !== 'all' && r.client !== clientFilter) return false
        if (statusFilter !== 'all' && r.status !== statusFilter) return false
        if (locationFilter && !r.location?.toLowerCase().includes(locationFilter.toLowerCase()))
          return false
        return true
      }),
    [rows, startDate, endDate, clientFilter, statusFilter, locationFilter],
  )

  const handleUpdate = async (id: string, field: string, value: any) => {
    setSavingId(id)
    await updateRecord(id, field, value)
    setSavingId(null)
  }

  const handleSave = async () => {
    if (await addRecord(form)) setOpen(false)
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setClientFilter('all')
    setStatusFilter('all')
    setLocationFilter('')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 print:hidden bg-muted/30 p-4 rounded-lg border">
        <div className="space-y-1">
          <Label className="text-xs">Data Inicial</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Data Final</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cliente</Label>
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
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
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
        <div className="space-y-1">
          <Label className="text-xs">Local</Label>
          <Input
            placeholder="Buscar..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button variant="outline" className="w-full" onClick={clearFilters}>
            Limpar
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center print:hidden">
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredRows.length} registros
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={printPage} className="gap-2">
            <Printer className="w-4 h-4" /> Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={printPage} className="gap-2">
            <FileDown className="w-4 h-4" /> Exportar PDF
          </Button>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Registro
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Intervalo</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Valor/h</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Dia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
                    <p>Carregando...</p>
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </TableCell>
                    <TableCell className="p-1 min-w-[100px]">
                      <EditableCell
                        type="time"
                        value={r.start_time.slice(0, 5)}
                        disabled={savingId === r.id}
                        onBlur={(v: string) => handleUpdate(r.id, 'start_time', v)}
                      />
                    </TableCell>
                    <TableCell className="p-1 min-w-[100px]">
                      <EditableCell
                        type="time"
                        value={r.end_time.slice(0, 5)}
                        disabled={savingId === r.id}
                        onBlur={(v: string) => handleUpdate(r.id, 'end_time', v)}
                      />
                    </TableCell>
                    <TableCell className="p-1 min-w-[90px]">
                      <EditableCell
                        type="number"
                        step="0.5"
                        min="0"
                        value={r.break_time}
                        disabled={savingId === r.id}
                        onBlur={(v: string) => handleUpdate(r.id, 'break_time', parseFloat(v) || 0)}
                      />
                    </TableCell>
                    <TableCell className="font-medium min-w-[80px]">
                      {savingId === r.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        `${r.wh.toFixed(2)}h`
                      )}
                    </TableCell>
                    <TableCell className="p-1 min-w-[100px]">
                      <EditableCell
                        type="number"
                        step="1"
                        min="0"
                        value={r.hourly_rate}
                        disabled={savingId === r.id}
                        onBlur={(v: string) =>
                          handleUpdate(r.id, 'hourly_rate', parseFloat(v) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell>{r.client || '-'}</TableCell>
                    <TableCell>{r.location || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={r.status === 'Pago' ? 'default' : 'secondary'}
                        className={r.status === 'Pago' ? 'bg-green-500' : ''}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600 dark:text-green-400 min-w-[100px]">
                      {savingId === r.id ? (
                        <Loader2 className="w-4 h-4 animate-spin inline text-primary ml-2" />
                      ) : (
                        `R$ ${r.dt.toFixed(2)}`
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {filteredRows.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-bold">
                    Totais:
                  </TableCell>
                  <TableCell className="font-bold">
                    {filteredRows.reduce((a, b) => a + b.wh, 0).toFixed(2)}h
                  </TableCell>
                  <TableCell colSpan={4}></TableCell>
                  <TableCell className="text-right font-bold text-lg text-primary">
                    R$ {filteredRows.reduce((a, b) => a + b.dt, 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Registro</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Entrada</Label>
              <Input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Saída</Label>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Intervalo (h)</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={form.break_time}
                onChange={(e) => setForm({ ...form, break_time: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor/Hora</Label>
              <Input
                type="number"
                min="0"
                value={form.hourly_rate}
                onChange={(e) => setForm({ ...form, hourly_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Cliente</Label>
              <Input
                placeholder="Ex: Acme"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Local</Label>
              <Input
                placeholder="Ex: Home"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
