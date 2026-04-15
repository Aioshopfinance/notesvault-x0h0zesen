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

type ManageStatusModalProps = {
  open: boolean
  onOpenChange: (value: boolean) => void
}

type StatusItem = {
  id: string
  name: string
  color: string
}

function StatusRow({ status }: { status: StatusItem }) {
  const { updateStatus, deleteStatus } = useTimesheetContext()
  const [name, setName] = useState(status.name)
  const [color, setColor] = useState(status.color)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = async () => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      setName(status.name)
      return
    }

    if (trimmedName !== status.name || color !== status.color) {
      await updateStatus(status.id, trimmedName, color)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Deseja realmente excluir o status "${status.name}"?\n\nEssa ação remove apenas este status do sistema.`,
    )

    if (!confirmed) return

    try {
      setIsDeleting(true)
      await deleteStatus(status.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        onBlur={handleSave}
        className="h-9 w-12 shrink-0 cursor-pointer p-1"
        aria-label={`Cor do status ${status.name}`}
      />

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSave()
          }
        }}
        className="flex-1"
        aria-label={`Nome do status ${status.name}`}
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="shrink-0"
        disabled={isDeleting}
        aria-label={`Excluir status ${status.name}`}
        title={`Excluir status ${status.name}`}
      >
        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  )
}

function ManageStatusModal({ open, onOpenChange }: ManageStatusModalProps) {
  const { statuses, addStatus } = useTimesheetContext()
  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('#3b82f6')

  const handleAdd = async () => {
    const trimmedName = newStatusName.trim()
    if (!trimmedName) return

    const success = await addStatus(trimmedName, newStatusColor)

    if (success) {
      setNewStatusName('')
      setNewStatusColor('#3b82f6')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {statuses.map((status: StatusItem) => (
              <StatusRow key={status.id} status={status} />
            ))}
          </div>

          <div className="flex items-center gap-2 border-t pt-4">
            <Input
              type="color"
              value={newStatusColor}
              onChange={(e) => setNewStatusColor(e.target.value)}
              className="h-9 w-12 shrink-0 cursor-pointer p-1"
              aria-label="Cor do novo status"
            />

            <Input
              placeholder="Novo status..."
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdd()
                }
              }}
              className="flex-1"
              aria-label="Nome do novo status"
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
    <div className="flex-1 overflow-auto bg-background p-4 print:overflow-visible print:p-0 md:p-8">
      <div className="mx-auto max-w-6xl print:max-w-none print:w-full">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 print:hidden sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
              <Clock className="h-8 w-8 text-primary" />
              Banco de Horas
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setManageStatusOpen(true)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Gerenciar status"
                title="Gerenciar status"
              >
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </h2>

            <p className="mt-1 text-muted-foreground">
              Gerencie suas horas trabalhadas e ganhos com base nos seus registros diários.
            </p>
          </div>
        </div>

        <Tabs defaultValue="registros" className="w-full">
          <TabsList className="mb-8 flex h-auto w-full flex-col items-stretch justify-start gap-4 bg-transparent p-0 print:hidden sm:flex-row">
            <TabsTrigger
              value="registros"
              className="flex h-auto flex-1 flex-col items-start justify-start gap-2 whitespace-normal rounded-xl border bg-muted/30 p-5 text-left transition-all data-[state=active]:border-primary/50 data-[state=active]:bg-card data-[state=active]:shadow-md"
            >
              <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                <List className="h-5 w-5 text-primary" />
                Registros
              </div>

              <span className="text-sm font-normal leading-snug text-muted-foreground">
                Adicione, edite e acompanhe suas horas diárias
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="dashboard"
              className="flex h-auto flex-1 flex-col items-start justify-start gap-2 whitespace-normal rounded-xl border bg-muted/30 p-5 text-left transition-all data-[state=active]:border-primary/50 data-[state=active]:bg-card data-[state=active]:shadow-md"
            >
              <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" />
                Dashboard Mensal
              </div>

              <span className="text-sm font-normal leading-snug text-muted-foreground">
                Visualize seus ganhos e estatísticas
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="relatorio"
              className="flex h-auto flex-1 flex-col items-start justify-start gap-2 whitespace-normal rounded-xl border bg-muted/30 p-5 text-left transition-all data-[state=active]:border-primary/50 data-[state=active]:bg-card data-[state=active]:shadow-md"
            >
              <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Relatório de Pagamento
              </div>

              <span className="text-sm font-normal leading-snug text-muted-foreground">
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
