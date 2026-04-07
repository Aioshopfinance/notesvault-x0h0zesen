import { useState, useEffect, useMemo, useCallback } from 'react'
import { Clock, Plus, Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

const EditableCell = ({ value, type, onBlur, disabled, min, step }: any) => {
  const [val, setVal] = useState(value)
  useEffect(() => setVal(value), [value])

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
      className="h-8 w-full min-w-[70px] px-2 py-1 text-sm border-transparent hover:border-input focus:border-input bg-transparent shadow-none transition-colors"
    />
  )
}

export default function Timesheet() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)

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

  const fetchRecords = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    const { data: records } = await (supabase as any)
      .from('timesheets')
      .select('*')
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })

    setData(records || [])
    if (showLoading) setLoading(false)
  }, [])

  useEffect(() => {
    if (user) fetchRecords()
  }, [user, fetchRecords])

  const rows = useMemo(() => {
    return data.map((r) => {
      const getHours = (t: string) => {
        const [h, m] = t.split(':').map(Number)
        return h + m / 60
      }
      let diff = getHours(r.end_time) - getHours(r.start_time)
      if (diff < 0) diff += 24

      const wh = Math.max(0, diff - Number(r.break_time))
      const dt = wh * Number(r.hourly_rate)
      return { ...r, wh, dt }
    })
  }, [data])

  const handleSave = async () => {
    if (!user) return
    const payload = { ...form, user_id: user.id }
    const { error } = await (supabase as any).from('timesheets').insert(payload)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Registro adicionado com sucesso!' })
      setOpen(false)
      fetchRecords()
    }
  }

  const handleUpdate = async (id: string, field: string, value: any) => {
    setSavingId(id)
    try {
      const { error } = await (supabase as any)
        .from('timesheets')
        .update({ [field]: value })
        .eq('id', id)

      if (error) throw error
      toast({ title: 'Sucesso', description: 'Registro atualizado e recalculado automaticamente.' })
      await fetchRecords(false)
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Clock className="w-8 h-8 text-primary" /> Banco de Horas
            </h2>
            <p className="text-muted-foreground mt-1">
              Gerencie suas horas trabalhadas e ganhos com base nos seus registros diários.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Registro
          </Button>
        </div>

        <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Saída</TableHead>
                  <TableHead>Intervalo (h)</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Valor/h (R$)</TableHead>
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
                      <p className="text-sm text-muted-foreground">Carregando...</p>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
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
                          onBlur={(v: string) =>
                            handleUpdate(r.id, 'break_time', parseFloat(v) || 0)
                          }
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
                          className={r.status === 'Pago' ? 'bg-green-500 hover:bg-green-600' : ''}
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
              {rows.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">
                      Totais Gerais:
                    </TableCell>
                    <TableCell className="font-bold">
                      {rows.reduce((a, b) => a + b.wh, 0).toFixed(2)}h
                    </TableCell>
                    <TableCell colSpan={4}></TableCell>
                    <TableCell className="text-right font-bold text-lg text-primary">
                      R$ {rows.reduce((a, b) => a + b.dt, 0).toFixed(2)}
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
              <DialogTitle>Novo Registro de Horas</DialogTitle>
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
                  onChange={(e) =>
                    setForm({ ...form, break_time: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Valor/Hora</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.hourly_rate}
                  onChange={(e) =>
                    setForm({ ...form, hourly_rate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Cliente</Label>
                <Input
                  placeholder="Ex: Acme Corp"
                  value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Local</Label>
                <Input
                  placeholder="Ex: Home Office"
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
    </div>
  )
}
