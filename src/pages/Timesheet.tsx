import { Clock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimesheetProvider } from '@/components/timesheet/TimesheetContext'
import RecordsTab from '@/components/timesheet/RecordsTab'
import DashboardTab from '@/components/timesheet/DashboardTab'
import ReportTab from '@/components/timesheet/ReportTab'

export default function Timesheet() {
  return (
    <TimesheetProvider>
      <div className="flex-1 overflow-auto p-4 md:p-8 bg-background print:p-0 print:overflow-visible">
        <div className="max-w-6xl mx-auto print:max-w-none print:w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 print:hidden">
            <div>
              <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Clock className="w-8 h-8 text-primary" /> Banco de Horas
              </h2>
              <p className="text-muted-foreground mt-1">
                Gerencie suas horas trabalhadas e ganhos com base nos seus registros diários.
              </p>
            </div>
          </div>

          <Tabs defaultValue="registros" className="w-full">
            <TabsList className="mb-4 print:hidden w-full justify-start overflow-x-auto">
              <TabsTrigger value="registros">Registros</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard Mensal</TabsTrigger>
              <TabsTrigger value="relatorio">Relatório de Pagamento</TabsTrigger>
            </TabsList>

            <TabsContent value="registros" className="m-0 border-none p-0 outline-none">
              <RecordsTab />
            </TabsContent>

            <TabsContent
              value="dashboard"
              className="m-0 border-none p-0 outline-none print:hidden"
            >
              <DashboardTab />
            </TabsContent>

            <TabsContent value="relatorio" className="m-0 border-none p-0 outline-none">
              <ReportTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TimesheetProvider>
  )
}
