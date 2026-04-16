import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

type DailyRecord = {
  id: string
  work_date: string
  client_name: string
  worker_name: string
  unit_value: number
  gross_amount: number
}

export default function DailyBank() {
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecords()
  }, [])

  async function fetchRecords() {
    setLoading(true)

    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .order('work_date', { ascending: false })

    if (error) {
      console.error('Erro ao buscar registros:', error)
    } else {
      setRecords(data || [])
    }

    setLoading(false)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Banco de Diária</h1>

      {loading && <p>Carregando...</p>}

      {!loading && records.length === 0 && <p>Nenhum registro encontrado.</p>}

      {!loading && records.length > 0 && (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th>Data</th>
              <th>Cliente</th>
              <th>Trabalhador</th>
              <th>Valor</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item) => (
              <tr key={item.id}>
                <td>{item.work_date}</td>
                <td>{item.client_name}</td>
                <td>{item.worker_name}</td>
                <td>{item.unit_value}</td>
                <td>{item.gross_amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
