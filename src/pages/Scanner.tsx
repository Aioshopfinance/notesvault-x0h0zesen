import { Camera, Maximize, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import Tesseract from 'tesseract.js'

export default function Scanner() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()

  const runOCR = async (image: string) => {
    try {
      const ocrResult = await Tesseract.recognize(image, 'por', {
        logger: (message) => {
          console.log('OCR progress:', message)
        },
      })

      const extractedText = ocrResult.data.text?.trim() || ''

      setResult(extractedText)

      toast({
        title: 'Escaneamento concluído',
        description: extractedText
          ? 'Texto extraído com sucesso via OCR real.'
          : 'Nenhum texto foi identificado na imagem.',
      })
    } catch (error) {
      console.error('Erro ao processar OCR:', error)

      toast({
        title: 'Erro no escaneamento',
        description: 'Não foi possível processar a imagem.',
        variant: 'destructive',
      })
    } finally {
      setScanning(false)
    }
  }

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Selecione uma imagem válida.',
        variant: 'destructive',
      })
      return
    }

    setScanning(true)
    setResult('')

    const reader = new FileReader()

    reader.onload = async () => {
      const imageData = reader.result as string
      setSelectedImage(imageData)
      await runOCR(imageData)
    }

    reader.onerror = () => {
      setScanning(false)
      toast({
        title: 'Erro ao ler arquivo',
        description: 'Não foi possível carregar a imagem selecionada.',
        variant: 'destructive',
      })
    }

    reader.readAsDataURL(file)
  }

  const handleCaptureClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 bg-background">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Scanner OCR
            </h2>
            <p className="text-muted-foreground">
              Digitalize documentos e extraia o texto automaticamente.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="relative aspect-[3/4] sm:aspect-video bg-muted/50 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden shadow-inner">
            {selectedImage && !scanning ? (
              <img
                src={selectedImage}
                alt="Documento selecionado"
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : null}

            {scanning ? (
              <div className="absolute inset-0 bg-primary/5 flex flex-col items-center justify-center animate-pulse z-10">
                <div className="w-full h-1 bg-primary/50 absolute top-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[slide-down_2s_ease-in-out_infinite_alternate]" />
                <Maximize className="w-12 h-12 text-primary animate-spin" />
                <span className="mt-4 font-medium text-primary">
                  Analisando documento...
                </span>
              </div>
            ) : !selectedImage ? (
              <div className="text-center text-muted-foreground">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Selecione ou capture uma imagem do documento</p>
              </div>
            ) : null}
          </div>

          <Button
            onClick={handleCaptureClick}
            disabled={scanning}
            className="w-full h-14 text-lg shadow-elevation transition-all hover:translate-y-[-2px]"
          >
            <Camera className="mr-2 w-5 h-5" />
            {scanning ? 'Processando Imagem...' : 'Capturar e Extrair Texto'}
          </Button>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <h3 className="text-xl font-semibold flex items-center gap-2 pt-2 md:pt-14">
            <FileText className="w-5 h-5 text-primary" />
            Texto Extraído
          </h3>

          <div className="flex-1 p-6 bg-card rounded-2xl min-h-[300px] border shadow-sm relative overflow-hidden group">
            {!result && !scanning && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50 text-sm text-center px-6">
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
