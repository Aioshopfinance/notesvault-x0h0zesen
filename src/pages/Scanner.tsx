import { Camera, Maximize, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export default function Scanner() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState('')
  const { toast } = useToast()

  const handleCapture = () => {
    setScanning(true)
    setResult('')

    // Simulating OCR process
    setTimeout(() => {
      setScanning(false)
      setResult(
        'REPÚBLICA FEDERATIVA DO BRASIL\nREGISTRO GERAL\n\nNome: JOÃO DA SILVA\nData de Nascimento: 01/01/1980\nCPF: 123.456.789-00\nValidade: INDETERMINADA',
      )
      toast({
        title: 'Escaneamento concluído',
        description: 'Texto extraído com sucesso via OCR.',
      })
    }, 2500)
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 bg-background">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Scanner Controller */}
        <div className="flex-1 flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Scanner OCR</h2>
            <p className="text-muted-foreground">
              Digitalize documentos e extraia o texto automaticamente.
            </p>
          </div>

          <div className="relative aspect-[3/4] sm:aspect-video bg-muted/50 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden shadow-inner">
            {scanning ? (
              <div className="absolute inset-0 bg-primary/5 flex flex-col items-center justify-center animate-pulse">
                <div className="w-full h-1 bg-primary/50 absolute top-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[slide-down_2s_ease-in-out_infinite_alternate]" />
                <Maximize className="w-12 h-12 text-primary animate-spin" />
                <span className="mt-4 font-medium text-primary">Analisando documento...</span>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Posicione o documento na câmera</p>
              </div>
            )}
          </div>

          <Button
            onClick={handleCapture}
            disabled={scanning}
            className="w-full h-14 text-lg shadow-elevation transition-all hover:translate-y-[-2px]"
          >
            <Camera className="mr-2 w-5 h-5" />
            {scanning ? 'Processando Imagem...' : 'Capturar e Extrair Texto'}
          </Button>
        </div>

        {/* OCR Result */}
        <div className="flex-1 flex flex-col gap-6">
          <h3 className="text-xl font-semibold flex items-center gap-2 pt-2 md:pt-14">
            <FileText className="w-5 h-5 text-primary" />
            Texto Extraído
          </h3>
          <div className="flex-1 p-6 bg-card rounded-2xl min-h-[300px] border shadow-sm relative overflow-hidden group">
            {!result && !scanning && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50 text-sm">
                O resultado do OCR aparecerá aqui.
              </div>
            )}
            {result && (
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed animate-fade-in-up">
                {result}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
