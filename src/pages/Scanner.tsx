import { Camera, Maximize, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRef, useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import Tesseract from 'tesseract.js'
import { supabase } from '@/lib/supabase/client'

export default function Scanner() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()

  // 🔥 CORREÇÃO: limpar memória da imagem (resolve bug visual)
  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage)
      }
    }
  }, [selectedImage])

  const runOCRAndSave = async (file: File, imageUrl: string) => {
    try {
      setScanning(true)
      setResult('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw new Error(userError.message)
      if (!user) throw new Error('Usuário não autenticado.')

      // OCR
      const ocrResult = await Tesseract.recognize(imageUrl, 'por', {
        logger: (message) => {
          console.log('OCR:', message)
        },
      })

      const extractedText = ocrResult.data.text?.trim() || ''
      setResult(extractedText)

      // Nome seguro do arquivo
      const fileExt = file.name.split('.').pop() || 'jpg'
      const safeFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_')

      const filePath = `${user.id}/${Date.now()}-${safeFileName}.${fileExt}`

      // Upload
      const { error: uploadError } = await supabase.storage.from('scans').upload(filePath, file)

      if (uploadError) throw new Error(uploadError.message)

      // URL pública
      const { data } = supabase.storage.from('scans').getPublicUrl(filePath)
      const publicUrl = data.publicUrl

      // Salvar no banco
      const { error: insertError } = await supabase.from('scans').insert({
        file_name: file.name,
        image_url: publicUrl,
        extracted_text: extractedText,
        user_id: user.id,
      })

      if (insertError) throw new Error(insertError.message)

      toast({
        title: 'Sucesso',
        description: 'Scan salvo com sucesso 🚀',
      })
    } catch (error) {
      console.error(error)

      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro no processamento',
        variant: 'destructive',
      })
    } finally {
      setScanning(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Selecione uma imagem válida',
        variant: 'destructive',
      })
      return
    }

    setSelectedFile(file)
    setResult('')

    const imageUrl = URL.createObjectURL(file)
    setSelectedImage(imageUrl)

    await runOCRAndSave(file, imageUrl)
  }

  const handleCaptureClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 bg-background">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        {/* ESQUERDA */}
        <div className="flex-1 flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Scanner OCR</h2>
            <p className="text-muted-foreground">
              Digitalize documentos e extraia texto automaticamente.
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

          <div className="relative h-[400px] bg-muted/50 rounded-2xl border flex items-center justify-center overflow-hidden">
            {selectedImage && !scanning && (
              <img
                src={selectedImage}
                alt="preview"
                className="max-h-full max-w-full object-contain"
              />
            )}

            {scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Maximize className="animate-spin w-10 h-10" />
                <span className="mt-2">Processando...</span>
              </div>
            )}

            {!selectedImage && !scanning && (
              <div className="text-center text-muted-foreground">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Selecione uma imagem</p>
              </div>
            )}
          </div>

          <Button onClick={handleCaptureClick} disabled={scanning}>
            <Camera className="mr-2 w-5 h-5" />
            {scanning ? 'Processando...' : 'Capturar e Extrair Texto'}
          </Button>

          {selectedFile && !scanning && (
            <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
          )}
        </div>

        {/* DIREITA */}
        <div className="flex-1 flex flex-col gap-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Texto Extraído
          </h3>

          <div className="flex-1 p-4 bg-card rounded-2xl border min-h-[300px] overflow-auto">
            {result ? (
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            ) : (
              <p className="text-muted-foreground text-sm text-center mt-10">
                O texto aparecerá aqui
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
