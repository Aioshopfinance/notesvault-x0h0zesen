import { useState, useMemo } from 'react'
import { useTimesheetContext } from './TimesheetContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { Clock, DollarSign } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function DashboardTab() {
  const { rows } = useTimesheetContext()
  const [monthYear, setMonthYear] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const monthRows = useMemo(
    () => rows.filter((r) => r.date.startsWith(monthYear)),
    [rows, monthYear],
  )

  const totalHours = monthRows.reduce((acc, r) => acc + r.wh, 0)
  const totalValue = monthRows.reduce((acc, r) => acc + r.dt, 0)

  const barData = useMemo(() => {
    const days: Record<string, number> = {}
    monthRows.forEach((r) => {
      const day = format(parseISO(r.date), 'dd/MM')
      days[day] = (days[day] || 0) + r.wh
    })
    return Object.entries(days)
      .map(([name, hours]) => ({ name, hours }))
      .reverse()
  }, [monthRows])

  const pieData = useMemo(() => {
    const clients: Record<string, number> = {}
    monthRows.forEach((r) => {
      const c = r.client || 'Sem cliente'
      clients[c] = (clients[c] || 0) + r.wh
    })
    return Object.entries(clients).map(([name, value]) => ({ name, value }))
  }, [monthRows])

  const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

  return (
    <div className="space-y-6 print:hidden">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-medium">Filtro de Período:</h3>
        <Input
          type="month"
          value={monthYear}
          onChange={(e) => setMonthYear(e.target.value)}
          className="w-48"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(2)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Dinheiro</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Horas por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ hours: { label: 'Horas', color: 'hsl(var(--primary))' } }}
              className="h-[300px] w-full"
            >
              <BarChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}h`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="hours" fill="var(--color-hours)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: 'Horas' } }} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
