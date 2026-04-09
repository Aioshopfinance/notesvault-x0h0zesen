import { Clock, Settings as SettingsIcon, Trash2, List, BarChart3, FileText } from 'lucide-react'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimesheetProvider, useTimesheetContext } from '@/components/timesheet/TimesheetContext'
import RecordsTab from '@/components/timesheet/RecordsTab'
import DashboardTab from '@/components/timesheet/DashboardTab'
import ReportTab from '@/components/timesheet/ReportTab'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

function ManageStatusModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { statuses, addStatus, updateStatus, deleteStatus } = useTimesheetContext()
  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('#3b82f6')

  const handleAdd = async () => {
    if (!newStatusName.trim()) return
    const success = await addStatus(newStatusName, newStatusColor)
    if (success) {
      setNewStatusName('')
      setNewStatusColor('#3b82f6')
    }
  }

  function StatusRow({ status }: { status: any }) {
    const [name, setName] = useState(status.name)
    const [color, setColor] = useState(status.color)

    const handleSave = () => {
      if (name !== status.name || color !== status.color) {
        updateStatus(status.id, name, color)
      }
    }

    return (
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          onBlur={handleSave}
          className="w-12 h-9 p-1 cursor-pointer shrink-0"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteStatus(status.id)}
          className="shrink-0"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {statuses.map((s) => (
              <StatusRow key={s.id} status={s} />
            ))}
          </div>
          <div className="flex items-center gap-2 pt-4 border-t">
            <Input
              type="color"
              value={newStatusColor}
              onChange={(e) => setNewStatusColor(e.target.value)}
              className="w-12 h-9 p-1 cursor-pointer shrink-0"
            />
            <Input
              placeholder="Novo status..."
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1"
            />
            <Button onClick={handleAdd}>Adicionar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TimesheetContent() {
  const [manageStatusOpen, setManageStatusOpen] = useState(false)

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 bg-background print:p-0 print:overflow-visible">
      <div className="max-w-6xl mx-auto print:max-w-none print:w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 print:hidden">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Clock className="w-8 h-8 text-primary" /> Banco de Horas
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setManageStatusOpen(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <SettingsIcon className="w-5 h-5" />
              </Button>
            </h2>
            <p className="text-muted-foreground mt-1">
              Gerencie suas horas trabalhadas e ganhos com base nos seus registros diários.
            </p>
          </div>
        </div>

        <Tabs defaultValue="registros" className="w-full">
          <TabsList className="h-auto p-0 bg-transparent gap-4 mb-8 print:hidden w-full flex flex-col sm:flex-row justify-start items-stretch">
            <TabsTrigger
              value="registros"
              className="flex-1 data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:border-primary/50 border bg-muted/30 p-5 justify-start text-left flex flex-col items-start gap-2 h-auto whitespace-normal rounded-xl transition-all"
            >
              <div className="flex items-center gap-2 font-semibold text-base text-foreground">
                <List className="w-5 h-5 text-primary" />
                Registros
              </div>
              <span className="text-sm font-normal text-muted-foreground leading-snug">
                Adicione, edite e acompanhe suas horas diárias
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="dashboard"
              className="flex-1 data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:border-primary/50 border bg-muted/30 p-5 justify-start text-left flex flex-col items-start gap-2 h-auto whitespace-normal rounded-xl transition-all"
            >
              <div className="flex items-center gap-2 font-semibold text-base text-foreground">
                <BarChart3 className="w-5 h-5 text-primary" />
                Dashboard Mensal
              </div>
              <span className="text-sm font-normal text-muted-foreground leading-snug">
                Visualize seus ganhos e estatísticas
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="relatorio"
              className="flex-1 data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:border-primary/50 border bg-muted/30 p-5 justify-start text-left flex flex-col items-start gap-2 h-auto whitespace-normal rounded-xl transition-all"
            >
              <div className="flex items-center gap-2 font-semibold text-base text-foreground">
                <FileText className="w-5 h-5 text-primary" />
                Relatório de Pagamento
              </div>
              <span className="text-sm font-normal text-muted-foreground leading-snug">
                Exporte relatórios e gerencie status
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registros" className="m-0 border-none p-0 outline-none">
            <RecordsTab />
          </TabsContent>

          <TabsContent value="dashboard" className="m-0 border-none p-0 outline-none print:hidden">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="relatorio" className="m-0 border-none p-0 outline-none">
            <ReportTab />
          </TabsContent>
        </Tabs>
      </div>
      <ManageStatusModal open={manageStatusOpen} onOpenChange={setManageStatusOpen} />
    </div>
  )
}

export default function Timesheet() {
  return (
    <TimesheetProvider>
      <TimesheetContent />
    </TimesheetProvider>
  )
}
