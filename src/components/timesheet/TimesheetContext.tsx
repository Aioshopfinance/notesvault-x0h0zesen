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
  status: string
  wh: number
  dt: number
}

interface TimesheetContextData {
  rows: TimesheetRow[]
  loading: boolean
  addRecord: (payload: any) => Promise<boolean>
  updateRecord: (id: string, field: string, value: any) => Promise<boolean>
  updateBulkRecords: (ids: string[], field: string, value: any) => Promise<boolean>
  markAsPaid: (client: string) => Promise<boolean>
}

const Context = createContext<TimesheetContextData | null>(null)

export const TimesheetProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(
    async (showLoading = true) => {
      if (!user) return
      if (showLoading) setLoading(true)
      const { data: records, error } = await supabase
        .from('timesheets')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })

      if (error) {
        toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' })
      } else {
        setData(records || [])
      }
      if (showLoading) setLoading(false)
    },
    [user, toast],
  )

  useEffect(() => {
    fetchRecords()
    if (!user) return
    const sub = supabase
      .channel('timesheets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timesheets', filter: `user_id=eq.${user.id}` },
        () => {
          fetchRecords(false)
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(sub)
    }
  }, [user, fetchRecords])

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
      return { ...r, wh, dt }
    })
  }, [data])

  const addRecord = async (payload: any) => {
    if (!user) return false
    const { error } = await supabase.from('timesheets').insert({ ...payload, user_id: user.id })
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return false
    }
    toast({ title: 'Registro adicionado com sucesso!' })
    fetchRecords(false)
    return true
  }

  const updateRecord = async (id: string, field: string, value: any) => {
    const { error } = await supabase
      .from('timesheets')
      .update({ [field]: value })
      .eq('id', id)
    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
      return false
    }
    toast({ title: 'Sucesso', description: 'Registro atualizado.' })
    fetchRecords(false)
    return true
  }

  const updateBulkRecords = async (ids: string[], field: string, value: any) => {
    if (!user) return false
    const { error } = await supabase
      .from('timesheets')
      .update({ [field]: value })
      .in('id', ids)

    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
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
    const { error } = await supabase
      .from('timesheets')
      .update({ status: 'Pago' })
      .eq('user_id', user.id)
      .eq('client', client)
      .eq('status', 'Pendente')

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
      value={{ rows, loading, addRecord, updateRecord, updateBulkRecords, markAsPaid }}
    >
      {children}
    </Context.Provider>
  )
}

export const useTimesheetContext = () => {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useTimesheetContext must be used within TimesheetProvider')
  return ctx
}
