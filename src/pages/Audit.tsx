import { Activity, ShieldCheck } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import useSecretsStore from '@/stores/useSecretsStore'

export default function Audit() {
  const { auditLogs } = useSecretsStore()

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" /> Log de Auditoria
          </h2>
          <p className="text-muted-foreground mt-1 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            Trilha de auditoria inalterável para acesso a dados sensíveis.
          </p>
        </div>

        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Ação Realizada</TableHead>
                <TableHead>Secret Afetada</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(log.date).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.secretName}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={log.status === 'Sucesso' ? 'default' : 'destructive'}
                      className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {auditLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum registro de auditoria encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
