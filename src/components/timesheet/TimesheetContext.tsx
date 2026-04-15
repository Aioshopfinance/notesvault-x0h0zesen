import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export interface TimeRecordStatus {
  id: string
  user_id: string
  name: string
  color: string
}

export interface TimesheetRow {
  id: string
  user_id: string
  date: string
  start_time: string
  end_time: string
  break_time: number
  hourly_rate: number
  client: string | null
  location: string | null
  status_id: string
  status: string
  status_obj?: TimeRecordStatus
  wh: number
  dt: number
}

const DEFAULT_COLUMNS = [
  'date',
  'start_time',
  'end_time',
  'break_time',
  'wh',
  'hourly_rate',
  'client',
  'location',
  'status',
  'dt',
]

interface TimesheetContextData {
  rows: TimesheetRow[]
  statuses: TimeRecordStatus[]
  visibleColumns: string[]
  loading: boolean
  currency: string
  rate: number
  formatCurrency: (valueInUSD: number) => string
  addRecord: (payload: any) => Promise<boolean>
  updateRecord: (id: string, field: string, value: any) => Promise<boolean>
  deleteRecord: (id: string) => Promise<boolean>
  updateBulkRecords: (ids: string[], field: string, value: any) => Promise<boolean>
  markAsPaid: (client: string) => Promise<boolean>
  addStatus: (name: string, color: string) => Promise<boolean>
  updateStatus: (id: string, name: string, color: string) => Promise<boolean>
  deleteStatus: (id: string) => Promise<boolean>
  toggleColumn: (colId: string) => void
  resetColumns: () => void
}

const Context = createContext<TimesheetContextData | null>(null)

export const TimesheetProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const { toast } = useToast()

  const [data, setData] = useState<any[]>([])
  const [statuses, setStatuses] = useState<TimeRecordStatus[]>([])
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('USD')

  const rate = useMemo(() => {
    if (currency === 'BRL') return 5.2
    if (currency === 'EUR') return 0.92
    return 1
  }, [currency])

  const formatCurrency = useCallback(
    (valueInUSD: number) => {
      const converted = valueInUSD * rate
      const locales = currency === 'BRL' ? 'pt-BR' : currency === 'EUR' ? 'de-DE' : 'en-US'

      return new Intl.NumberFormat(locales, {
        style: 'currency',
        currency,
      }).format(converted)
    },
    [currency, rate],
  )

  const fetchStatuses = useCallback(async () => {
    if (!user) return

    const { data: st } = await supabase
      .from('time_record_statuses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')

    if (st) {
      setStatuses(st)
    }
  }, [user])

  const fetchPreferences = useCallback(async () => {
    if (!user) return

    const { data: pref } = await supabase
      .from('user_preferences')
      .select('timesheet_columns, currency')
      .eq('id', user.id)
      .single()

    if (
      pref?.timesheet_columns &&
      Array.isArray(pref.timesheet_columns) &&
      pref.timesheet_columns.length > 0
    ) {
      setVisibleColumns(pref.timesheet_columns)
    }

    if ((pref as any)?.currency) {
      setCurrency((pref as any).currency)
    }
  }, [user])

  const fetchRecords = useCallback(
    async (showLoading = true) => {
      if (!user) return

      if (showLoading) {
        setLoading(true)
      }

      const { data: records, error } = await supabase
        .from('timesheets')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })

      if (error) {
        toast({
          title: 'Erro ao carregar',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        setData(records || [])
      }

      if (showLoading) {
        setLoading(false)
      }
    },
    [user, toast],
  )

  useEffect(() => {
    fetchStatuses()
    fetchPreferences()
    fetchRecords()

    if (!user) return

    const sub = supabase
      .channel('timesheets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timesheets',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchRecords(false)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [user, fetchRecords, fetchStatuses, fetchPreferences])

  const rows = useMemo(() => {
    return data.map((r) => {
      const getHours = (t: string) => {
        const [h, m] = (t || '00:00').split(':').map(Number)
        return h + (m || 0) / 60
      }

      let diff = getHours(r.end_time) - getHours(r.start_time)
      if (diff < 0) diff += 24

      const wh = Math.max(0, diff - Number(r.break_time || 0))
      const dt = wh * Number(r.hourly_rate || 0)
      const status_obj = statuses.find((s) => s.id === r.status_id)

      return {
        ...r,
        wh,
        dt,
        status_obj,
        status: status_obj?.name || 'Desconhecido',
      }
    })
  }, [data, statuses])

  const toggleColumn = async (colId: string) => {
    const newCols = visibleColumns.includes(colId)
      ? visibleColumns.filter((c) => c !== colId)
      : [...visibleColumns, colId]

    setVisibleColumns(newCols)

    if (user) {
      await supabase.from('user_preferences').update({ timesheet_columns: newCols }).eq('id', user.id)
    }
  }

  const resetColumns = async () => {
    setVisibleColumns(DEFAULT_COLUMNS)

    if (user) {
      await supabase
        .from('user_preferences')
        .update({ timesheet_columns: DEFAULT_COLUMNS })
        .eq('id', user.id)
    }
  }

  const addStatus = async (name: string, color: string) => {
    if (!user) return false

    const { error } = await supabase.from('time_record_statuses').insert({
      user_id: user.id,
      name,
      color,
    })

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return false
    }

    toast({ title: 'Status criado!' })
    fetchStatuses()
    return true
  }

  const updateStatus = async (id: string, name: string, color: string) => {
    const { error } = await supabase
      .from('time_record_statuses')
      .update({ name, color })
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return false
    }

    fetchStatuses()
    return true
  }

  const deleteStatus = async (id: string) => {
    const inUse = rows.some((r) => r.status_id === id)

    if (inUse) {
      toast({
        title: 'Ação Bloqueada',
        description: 'Este status está em uso em um ou mais registros.',
        variant: 'destructive',
      })
      return false
    }

    const { error } = await supabase.from('time_record_statuses').delete().eq('id', id)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return false
    }

    toast({ title: 'Status removido' })
    fetchStatuses()
    return true
  }

  const addRecord = async (payload: any) => {
    if (!user) return false

    const { error } = await supabase.from('timesheets').insert({
      ...payload,
      user_id: user.id,
    })

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return false
    }

    toast({ title: 'Registro adicionado com sucesso!' })
    fetchRecords(false)
    return true
  }

  const updateRecord = async (id: string, field: string, value: any) => {
    if (!user) return false

    const { error } = await supabase
      .from('timesheets')
      .update({ [field]: value })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      })
      return false
    }

    toast({ title: 'Sucesso', description: 'Registro atualizado.' })
    fetchRecords(false)
    return true
  }

  const deleteRecord = async (id: string) => {
    if (!user) return false

    const { error } = await supabase
      .from('timesheets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      })
      return false
    }

    setData((prev) => prev.filter((record) => record.id !== id))

    toast({
      title: 'Registro excluído',
      description: 'O registro de horas foi removido com sucesso.',
    })

    fetchRecords(false)
    return true
  }

  const updateBulkRecords = async (ids: string[], field: string, value: any) => {
    if (!user) return false

    let actualField = field
    let actualValue = value

    if (field === 'status') {
      const statusObj = statuses.find((s) => s.name === value)
      if (statusObj) {
        actualField = 'status_id'
        actualValue = statusObj.id
      } else {
        return false
      }
    }

    const { error } = await supabase
      .from('timesheets')
      .update({ [actualField]: actualValue })
      .in('id', ids)
      .eq('user_id', user.id)

    if (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      })
      return false
    }

    if (field === 'status') {
      toast({ title: 'Sucesso', description: `Status atualizado para ${value}` })
    } else {
      toast({ title: 'Sucesso', description: 'Campo atualizado com sucesso' })
    }

    fetchRecords(false)
    return true
  }

  const markAsPaid = async (client: string) => {
    if (!user) return false

    const pagoStatus = statuses.find((s) => s.name.toLowerCase() === 'pago')
    const pendenteStatus = statuses.find((s) => s.name.toLowerCase() === 'pendente')

    if (!pagoStatus || !pendenteStatus) return false

    const { error } = await supabase
      .from('timesheets')
      .update({ status_id: pagoStatus.id })
      .eq('user_id', user.id)
      .eq('client', client)
      .eq('status_id', pendenteStatus.id)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return false
    }

    toast({ title: 'Sucesso', description: 'Registros atualizados para Pago.' })
    fetchRecords(false)
    return true
  }

  return (
    <Context.Provider
      value={{
        rows,
        statuses,
        visibleColumns,
        loading,
        currency,
        rate,
        formatCurrency,
        addRecord,
        updateRecord,
        deleteRecord,
        updateBulkRecords,
        markAsPaid,
        addStatus,
        updateStatus,
        deleteStatus,
        toggleColumn,
        resetColumns,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useTimesheetContext = () => {
  const ctx = useContext(Context)
  if (!ctx) {
    throw new Error('useTimesheetContext must be used within TimesheetProvider')
  }
  return ctx
}
