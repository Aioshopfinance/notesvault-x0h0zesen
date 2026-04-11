import { Camera, FileText, Edit2, Copy, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import Tesseract from 'tesseract.js'
import { supabase } from '@/lib/supabase/client'
import ImagePreview from '@/components/scanner/ImagePreview'

export default function Scanner() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')

  const [scans, setScans] = useState<any[]>([])
  const [isLoadingScans, setIsLoadingScans] = useState(true)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()

  const fetchScans = useCallback(async () => {
    try {
      setIsLoadingScans(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setScans(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoadingScans(false)
    }
  }, [])

  useEffect(() => {
    fetchScans()
  }, [fetchScans])

  useEffect(() => {
    return () => {
      // Cleanup de memória apenas para URLs locais (blob)
      if (selectedImage && selectedImage.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImage)
      }
    }
  }, [selectedImage])

  const runOCRAndSave = async (file: File, imageUrl: string) => {
    try {
      setScanning(true)
      setResult('')
      setSelectedScanId(null)
      setIsEditing(false)

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
          image_url: publicUrl,
          extracted_text: extractedText,
          user_id: user.id,
        })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      setSelectedScanId(newScan.id)
      fetchScans()

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
    setEditText('')
  }

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      toast({ title: 'Erro', description: 'O texto não pode estar vazio.', variant: 'destructive' })
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
      toast({ title: 'Sucesso', description: 'Texto atualizado com sucesso.' })
      fetchScans()
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao salvar o texto.', variant: 'destructive' })
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    toast({ title: 'Copiado!', description: 'Texto copiado para a área de transferência.' })
  }

  const handleSelectScan = (scan: any) => {
    setSelectedImage(scan.image_url)
    setResult(scan.extracted_text || '')
    setSelectedScanId(scan.id)
    setSelectedFile(null)
    setIsEditing(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 bg-background">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        {/* TOP: Scanner and Text */}
        <div className="flex flex-col md:flex-row gap-8">
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

            <ImagePreview imageUrl={selectedImage} />

            <Button onClick={handleCaptureClick} disabled={scanning}>
              {scanning ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Camera className="mr-2 w-5 h-5" />
              )}
              {scanning ? 'Processando...' : 'Capturar e Extrair Texto'}
            </Button>

            {selectedFile && !scanning && (
              <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
            )}
          </div>

          {/* DIREITA */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Texto Extraído
              </h3>
              {result && !isEditing && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 p-4 bg-card rounded-2xl border min-h-[300px] flex flex-col">
              {isEditing ? (
                <div className="flex flex-col h-full gap-4">
                  <Textarea
                    className="flex-1 min-h-[200px] resize-none"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Edite o texto extraído..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveEdit}>
                      <Save className="w-4 h-4 mr-2" /> Salvar
                    </Button>
                  </div>
                </div>
              ) : result ? (
                <pre className="whitespace-pre-wrap text-sm overflow-auto flex-1 font-sans">
                  {result}
                </pre>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <p className="text-sm">O texto aparecerá aqui</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM: My Scans */}
        <div className="flex flex-col gap-6 pt-8 border-t">
          <div>
            <h2 className="text-2xl font-bold mb-1">Meus Scans</h2>
            <p className="text-muted-foreground">Histórico de documentos digitalizados.</p>
          </div>

          {isLoadingScans ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : scans.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {scans.map((scan) => (
                <Card
                  key={scan.id}
                  className="cursor-pointer hover:border-primary transition-colors overflow-hidden flex flex-col group shadow-sm hover:shadow-md"
                  onClick={() => handleSelectScan(scan)}
                >
                  <div className="h-32 bg-muted relative overflow-hidden flex items-center justify-center">
                    {scan.image_url ? (
                      <img
                        src={scan.image_url}
                        alt={scan.display_name || scan.file_name || 'Scan'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p
                      className="font-medium text-sm truncate"
                      title={scan.display_name || scan.file_name || 'Documento sem nome'}
                    >
                      {scan.display_name || scan.file_name || 'Documento sem nome'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(scan.created_at))}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/30 rounded-2xl border border-dashed">
              <p className="text-muted-foreground">Nenhum scan encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
