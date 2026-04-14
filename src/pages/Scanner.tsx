import {
  Camera,
  FileText,
  Edit2,
  Copy,
  Save,
  Loader2,
  ArrowLeft,
  FolderOpen,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useRef, useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import Tesseract from 'tesseract.js'
import { supabase } from '@/lib/supabase/client'
import ImagePreview from '@/components/scanner/ImagePreview'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Scanner() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  // Ajuste esta rota caso sua tela "Meus Scans" use outro caminho.
  const scansListRoute = '/scans'

  useEffect(() => {
    if (location.state?.scan) {
      const scan = location.state.scan

      setSelectedImage(scan.image_url)
      setResult(scan.extracted_text || '')
      setSelectedScanId(scan.id)
      setSelectedFile(null)
      setIsEditing(false)
      setEditText('')

      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Limpa o state da navegação para evitar recarregar scan antigo no refresh.
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    return () => {
      // Cleanup de memória apenas para URLs locais (blob)
      if (selectedImage && selectedImage.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImage)
      }
    }
  }, [selectedImage])

  const resetScannerState = () => {
    if (selectedImage && selectedImage.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImage)
    }

    setScanning(false)
    setResult('')
    setSelectedImage(null)
    setSelectedFile(null)
    setSelectedScanId(null)
    setIsEditing(false)
    setEditText('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoToMyScans = () => {
    navigate(scansListRoute)
  }

  const handleNewScan = () => {
    resetScannerState()
  }

  const runOCRAndSave = async (file: File, imageUrl: string) => {
    try {
      setScanning(true)
      setResult('')
      setSelectedScanId(null)
      setIsEditing(false)
      setEditText('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw new Error(userError.message)
      if (!user) throw new Error('Usuário não autenticado.')

      const ocrResult = await Tesseract.recognize(imageUrl, 'por', {
        logger: (message) => {
          console.log('OCR:', message)
        },
      })

      const extractedText = ocrResult.data.text?.trim() || ''
      setResult(extractedText)

      const fileExt = file.name.split('.').pop() || 'jpg'
      const safeFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_')

      const filePath = `${user.id}/${Date.now()}-${safeFileName}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('scans').upload(filePath, file)

      if (uploadError) throw new Error(uploadError.message)

      const { data } = supabase.storage.from('scans').getPublicUrl(filePath)
      const publicUrl = data.publicUrl

      const { data: newScan, error: insertError } = await supabase
        .from('scans')
        .insert({
          file_name: file.name,
          display_name: file.name,
          image_url: publicUrl,
          extracted_text: extractedText,
          user_id: user.id,
        })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      setSelectedScanId(newScan.id)

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

    const imageUrl = URL.createObjectURL(file)
    setSelectedImage(imageUrl)

    await runOCRAndSave(file, imageUrl)
  }

  const handleCaptureClick = () => {
    fileInputRef.current?.click()
  }

  const handleEdit = () => {
    setEditText(result)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditText(result)
  }

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      toast({
        title: 'Erro',
        description: 'O texto não pode estar vazio.',
        variant: 'destructive',
      })
      return
    }

    try {
      if (selectedScanId) {
        const { error } = await supabase
          .from('scans')
          .update({ extracted_text: editText })
          .eq('id', selectedScanId)

        if (error) throw error
      }

      setResult(editText)
      setIsEditing(false)

      toast({
        title: 'Sucesso',
        description: 'Texto atualizado com sucesso.',
      })
    } catch (error) {
      console.error(error)

      toast({
        title: 'Erro',
        description: 'Falha ao salvar o texto.',
        variant: 'destructive',
      })
    }
  }

  const handleCopy = async () => {
    if (!result) return

    try {
      await navigator.clipboard.writeText(result)

      toast({
        title: 'Copiado!',
        description: 'Texto copiado para a área de transferência.',
      })
    } catch (error) {
      console.error(error)

      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o texto.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-background p-4 md:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold">Scanner OCR</h2>
              <p className="text-muted-foreground">
                Digitalize documentos e extraia texto automaticamente.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleGoBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              <Button variant="outline" onClick={handleGoToMyScans}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Ir para Meus Scans
              </Button>

              {(selectedImage || result || selectedScanId) && (
                <Button variant="secondary" onClick={handleNewScan}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Novo Scan
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 md:flex-row">
          {/* ESQUERDA */}
          <div className="flex flex-1 flex-col gap-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />

            <ImagePreview imageUrl={selectedImage} />

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button onClick={handleCaptureClick} disabled={scanning} className="w-full sm:w-auto">
                {scanning ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-5 w-5" />
                )}
                {scanning ? 'Processando...' : 'Capturar e Extrair Texto'}
              </Button>

              {selectedImage && !scanning && (
                <Button variant="outline" onClick={handleNewScan} className="w-full sm:w-auto">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Limpar e Recomeçar
                </Button>
              )}
            </div>

            {selectedFile && !scanning && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {selectedFile.name}
              </p>
            )}

            {!selectedImage && !scanning && (
              <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                Dica: após capturar um documento, você poderá copiar, editar, salvar o texto e
                navegar direto para a lista de scans.
              </div>
            )}
          </div>

          {/* DIREITA */}
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 text-xl font-semibold">
                <FileText className="h-5 w-5" />
                Texto Extraído
              </h3>

              {result && !isEditing && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleGoToMyScans}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Meus Scans
                  </Button>
                </div>
              )}
            </div>

            <div className="flex min-h-[300px] flex-1 flex-col rounded-2xl border bg-card p-4">
              {isEditing ? (
                <div className="flex h-full flex-col gap-4">
                  <Textarea
                    className="min-h-[200px] flex-1 resize-none"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Edite o texto extraído..."
                  />

                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>

                    <Button onClick={handleSaveEdit}>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : result ? (
                <pre className="flex-1 overflow-auto whitespace-pre-wrap font-sans text-sm">
                  {result}
                </pre>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
                  {scanning ? (
                    <>
                      <Loader2 className="mb-3 h-6 w-6 animate-spin" />
                      <p className="text-sm">Extraindo texto do documento...</p>
                    </>
                  ) : (
                    <p className="text-sm">O texto aparecerá aqui</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
