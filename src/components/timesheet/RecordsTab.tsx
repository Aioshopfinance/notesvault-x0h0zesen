import { useState, useMemo, useEffect } from 'react'
import { useTimesheetContext } from './TimesheetContext'
import { printPage } from './utils'
import { useAuth } from '@/hooks/use-auth'
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
import { Loader2, Plus, Printer, Columns, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

const COLUMNS_DEF = [
  { id: 'date', label: 'Data' },
  { id: 'start_time', label: 'Entrada' },
  { id: 'end_time', label: 'Saída' },
  { id: 'break_time', label: 'Intervalo' },
  { id: 'wh', label: 'Horas' },
  { id: 'hourly_rate', label: 'Valor/h' },
  { id: 'client', label: 'Cliente' },
  { id: 'location', label: 'Local' },
  { id: 'status', label: 'Status' },
  { id: 'dt', label: 'Total Dia' },
]

const EditableCell = ({ value, type, onBlur, disabled, min, step }: any) => {
  const [val, setVal] = useState(value ?? '')

  useEffect(() => {
    setVal(value ?? '')
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value

    if (type === 'number') {
      const normalized = nextValue.replace(',', '.')

      if (normalized === '') {
        setVal('')
        return
      }

      if (/^-?\d*\.?\d*$/.test(normalized)) {
        setVal(normalized)
      }

      return
    }

    setVal(nextValue)
  }

  const handleBlur = () => {
    if (disabled) return

    const originalValue = value ?? ''

    if (type === 'number') {
      if (val === '' || val === null) {
        setVal(originalValue)
        return
      }

      const parsed = Number(val)

      if (Number.isNaN(parsed)) {
        setVal(originalValue)
        return
      }

      if (String(parsed) !== String(originalValue) && parsed !== originalValue) {
        onBlur(String(parsed))
      }

      return
    }

    if (val !== originalValue) {
      onBlur(val)
    }
  }

  return (
    <Input
      type={type}
      value={val}
      min={min}
      step={step}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      className="h-8 w-full min-w-[70px] border-transparent bg-transparent px-2 py-1 text-sm shadow-none hover:border-input focus:border-input"
    />
  )
}

export default function RecordsTab() {
  const { user } = useAuth()
  const {
    rows,
    statuses,
    visibleColumns,
    toggleColumn,
    resetColumns,
    loading,
    currency,
    rate,
    formatCurrency,
    addRecord,
    updateRecord,
    deleteRecord,
  } = useTimesheetContext()

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
    hourly_rate: 0,
    client: '',
    location: '',
    status_id: '',
  })

  useEffect(() => {
    if (form.hourly_rate === 0 && rate) {
      setForm((f) => ({ ...f, hourly_rate: 17 * rate }))
    }
  }, [rate, form.hourly_rate])

  useEffect(() => {
    if (statuses.length > 0 && !form.status_id) {
      const defaultStatus =
        statuses.find((s: any) => s.name === 'Pendente') || statuses[0]

      setForm((f) => ({ ...f, status_id: defaultStatus.id }))
    }
  }, [statuses, form.status_id])

  const uniqueClients = useMemo(
    () => Array.from(new Set(rows.map((r: any) => r.client).filter(Boolean))),
    [rows],
  )

  const filteredRows = useMemo(
    () =>
      rows.filter((r: any) => {
        if (startDate && r.date < startDate) return false
        if (endDate && r.date > endDate) return false
        if (clientFilter !== 'all' && r.client !== clientFilter) return false
        if (statusFilter !== 'all' && r.status_id !== statusFilter) return false
        if (locationFilter && !r.location?.toLowerCase().includes(locationFilter.toLowerCase())) {
          return false
        }

        return true
      }),
    [rows, startDate, endDate, clientFilter, statusFilter, locationFilter],
  )

  const handleUpdate = async (id: string, field: string, value: any) => {
    setSavingId(id)

    try {
      await updateRecord(id, field, value)
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Deseja realmente excluir este registro de horas?')

    if (!confirmed) return

    setSavingId(id)

    try {
      await deleteRecord(id)
    } finally {
      setSavingId(null)
    }
  }

  const handleSave = async () => {
    const payload = {
      ...form,
      hourly_rate: rate ? form.hourly_rate / rate : form.hourly_rate,
    }

    if (await addRecord(payload)) {
      setOpen(false)
      setForm({
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '18:00',
        break_time: 1,
        hourly_rate: rate ? 17 * rate : 17,
        client: '',
        location: '',
        status_id: statuses.find((s: any) => s.name === 'Pendente')?.id || statuses[0]?.id || '',
      })
    }
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setClientFilter('all')
    setStatusFilter('all')
    setLocationFilter('')
  }

  const visibleDataColumns = COLUMNS_DEF.filter((c) =>
    visibleColumns.includes(c.id),
  )

  const tableColSpan = visibleDataColumns.length + 1

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          @page { size: landscape; margin: 1cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mb-8 hidden print:block">
        <h1 className="mb-2 text-2xl font-bold">Relatório de Banco de Horas</h1>

        <div className="flex justify-between border-b pb-4 text-sm text-muted-foreground">
          <div>
            <p>
              <strong>Usuário:</strong> {user?.user_metadata?.full_name || user?.email}
            </p>
            <p>
              <strong>Filtros:</strong>{' '}
              {startDate
                ? `${new Date(startDate).toLocaleDateString('pt-BR')} até ${
                    endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Hoje'
                  }`
                : 'Todos os registros'}
            </p>
          </div>

          <div className="text-right">
            <p>
              <strong>Data de Impressão:</strong> {new Date().toLocaleDateString('pt-BR')}
            </p>
            <p>
              <strong>Total de Registros:</strong> {filteredRows.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/30 p-4 print:hidden md:grid-cols-2 lg:grid-cols-6">
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
              {statuses.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
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

      <div className="flex flex-col items-start justify-between gap-4 print:hidden md:flex-row md:items-center">
        <div className="text-sm font-medium text-muted-foreground">
          Mostrando {filteredRows.length} registros
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto sm:flex-row">
          <div className="flex w-full gap-2 sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 gap-2 sm:flex-none">
                  <Columns className="h-4 w-4" /> Colunas
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Alternar Colunas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {COLUMNS_DEF.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.id}
                    checked={visibleColumns.includes(c.id)}
                    onCheckedChange={() => toggleColumn(c.id)}
                  >
                    {c.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={resetColumns}>Resetar Padrão</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={printPage}
              className="flex-1 gap-2 sm:flex-none"
            >
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </Button>
          </div>

          <Button size="sm" onClick={() => setOpen(true)} className="w-full gap-2 sm:w-auto">
            <Plus className="h-4 w-4" /> Novo Registro
          </Button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                {COLUMNS_DEF.filter((c) => visibleColumns.includes(c.id)).map((c) => (
                  <TableHead key={c.id} className={c.id === 'dt' ? 'text-right' : ''}>
                    {c.label}
                  </TableHead>
                ))}
                <TableHead className="w-[70px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={tableColSpan} className="py-12 text-center">
                    <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
                    <p>Carregando...</p>
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColSpan}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r: any) => (
                  <TableRow key={r.id}>
                    {visibleColumns.includes('date') && (
                      <TableCell className="min-w-[130px] p-1">
                        <EditableCell
                          type="date"
                          value={r.date}
                          disabled={savingId === r.id}
                          onBlur={(v: string) => handleUpdate(r.id, 'date', v)}
                        />
                      </TableCell>
                    )}

                    {visibleColumns.includes('start_time') && (
                      <TableCell className="min-w-[100px] p-1">
                        <EditableCell
                          type="time"
                          value={r.start_time.slice(0, 5)}
                          disabled={savingId === r.id}
                          onBlur={(v: string) => handleUpdate(r.id, 'start_time', v)}
                        />
                      </TableCell>
                    )}

                    {visibleColumns.includes('end_time') && (
                      <TableCell className="min-w-[100px] p-1">
                        <EditableCell
                          type="time"
                          value={r.end_time.slice(0, 5)}
                          disabled={savingId === r.id}
                          onBlur={(v: string) => handleUpdate(r.id, 'end_time', v)}
                        />
                      </TableCell>
                    )}

                    {visibleColumns.includes('break_time') && (
                      <TableCell className="min-w-[90px] p-1">
                        <EditableCell
                          type="number"
                          step="0.5"
                          min="0"
                          value={r.break_time}
                          disabled={savingId === r.id}
                          onBlur={(v: string) =>
                            handleUpdate(r.id, 'break_time', parseFloat(v) || 0)
                          }
                        />
                      </TableCell>
                    )}

                    {visibleColumns.includes('wh') && (
                      <TableCell className="min-w-[80px] font-medium">
                        {savingId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          `${r.wh.toFixed(2)}h`
                        )}
                      </TableCell>
                    )}

                    {visibleColumns.includes('hourly_rate') && (
                      <TableCell className="min-w-[100px] p-1">
                        <EditableCell
                          type="number"
                          step="0.01"
                          min="0"
                          value={(r.hourly_rate * rate).toFixed(2)}
                          disabled={savingId === r.id}
                          onBlur={(v: string) =>
                            handleUpdate(r.id, 'hourly_rate', (parseFloat(v) || 0) / rate)
                          }
                        />
                      </TableCell>
                    )}

                    {visibleColumns.includes('client') && (
                      <TableCell className="min-w-[120px] p-1">
                        <EditableCell
                          type="text"
                          value={r.client || ''}
                          disabled={savingId === r.id}
                          onBlur={(v: string) => handleUpdate(r.id, 'client', v)}
                        />
                      </TableCell>
                    )}

                    {visibleColumns.includes('location') && (
                      <TableCell className="min-w-[120px]">{r.location || '-'}</TableCell>
                    )}

                    {visibleColumns.includes('status') && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            disabled={savingId === r.id}
                            className="focus:outline-none"
                          >
                            <Badge
                              variant="outline"
                              className="cursor-pointer whitespace-nowrap"
                              style={{
                                backgroundColor: `${r.status_obj?.color}20`,
                                color: r.status_obj?.color,
                                borderColor: `${r.status_obj?.color}40`,
                              }}
                            >
                              {r.status_obj?.name || 'Desconhecido'}
                            </Badge>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent>
                            {statuses.map((s: any) => (
                              <DropdownMenuItem
                                key={s.id}
                                onClick={() => handleUpdate(r.id, 'status_id', s.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: s.color }}
                                  />
                                  {s.name}
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}

                    {visibleColumns.includes('dt') && (
                      <TableCell className="min-w-[100px] text-right font-medium text-green-600 dark:text-green-400">
                        {savingId === r.id ? (
                          <Loader2 className="ml-2 inline h-4 w-4 animate-spin text-primary" />
                        ) : (
                          formatCurrency(r.dt)
                        )}
                      </TableCell>
                    )}

                    <TableCell className="w-[70px] p-1 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(r.id)}
                        disabled={savingId === r.id}
                        title="Excluir registro"
                      >
                        {savingId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>

            {filteredRows.length > 0 && visibleDataColumns.length > 0 && (
              <TableFooter>
                <TableRow>
                  {visibleColumns.map((colId: string, i: number) => {
                    if (!visibleDataColumns.find((col) => col.id === colId)) {
                      return null
                    }

                    if (colId === 'wh') {
                      return (
                        <TableCell key={colId} className="font-bold">
                          {filteredRows.reduce((a: number, b: any) => a + b.wh, 0).toFixed(2)}h
                        </TableCell>
                      )
                    }

                    if (colId === 'dt') {
                      return (
                        <TableCell
                          key={colId}
                          className="text-right text-lg font-bold text-primary"
                        >
                          {formatCurrency(filteredRows.reduce((a: number, b: any) => a + b.dt, 0))}
                        </TableCell>
                      )
                    }

                    let totalsLabelIndex = 0

                    if (visibleColumns.indexOf('wh') > 0) {
                      totalsLabelIndex = visibleColumns.indexOf('wh') - 1
                    } else if (visibleColumns.indexOf('dt') > 0) {
                      totalsLabelIndex = visibleColumns.indexOf('dt') - 1
                    } else {
                      totalsLabelIndex = visibleColumns.length - 1
                    }

                    if (i === totalsLabelIndex && colId !== 'wh' && colId !== 'dt') {
                      return (
                        <TableCell key={colId} className="text-right font-bold">
                          Totais:
                        </TableCell>
                      )
                    }

                    return <TableCell key={colId}></TableCell>
                  })}
                  <TableCell></TableCell>
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
              <Select
                value={form.status_id}
                onValueChange={(v) => setForm({ ...form, status_id: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
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
                onChange={(e) =>
                  setForm({
                    ...form,
                    break_time: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Valor/Hora ({currency})</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.hourly_rate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hourly_rate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Cliente</Label>
              <Input
                placeholder="Ex: Acme"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
              />
            </div>

            <div className="col-span-2 space-y-2">
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
