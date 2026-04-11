import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, Edit2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ScanItem } from '@/lib/scanners/scan.types'

interface ScanCardProps {
  scan: ScanItem
  onClick: (scan: ScanItem) => void
  onRename: (scan: ScanItem) => void
  onDelete: (scan: ScanItem) => void
}

export function ScanCard({ scan, onClick, onRename, onDelete }: ScanCardProps) {
  return (
    <Card
      className="overflow-hidden flex flex-col group hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer"
      onClick={() => onClick(scan)}
    >
      <div className="relative h-48 bg-muted border-b overflow-hidden flex items-center justify-center">
        {scan.image_url ? (
          <img
            src={scan.image_url}
            alt={scan.display_name || scan.file_name || 'Scan'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
        )}

        <div
          className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-background/90 shadow-sm backdrop-blur-sm hover:bg-background"
            onClick={(e) => {
              e.stopPropagation()
              onRename(scan)
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8 shadow-sm opacity-90 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(scan)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <h3
          className="font-semibold text-sm line-clamp-1 mb-1.5"
          title={scan.display_name || scan.file_name || 'Sem nome'}
        >
          {scan.display_name || scan.file_name || 'Documento sem nome'}
        </h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
          {format(new Date(scan.created_at), 'dd MMM yyyy', { locale: ptBR })}
        </p>
        {scan.extracted_text && (
          <div className="mt-auto pt-3 border-t">
            <p className="text-xs text-muted-foreground line-clamp-2 italic">
              {scan.extracted_text}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
