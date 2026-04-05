import { useState, useEffect } from 'react'
import { Bold, Italic, List, ListOrdered, Link2, Pin, ChevronLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import useNotesStore from '@/stores/useNotesStore'
import { useToast } from '@/hooks/use-toast'

export function NoteEditor() {
  const { notes, selectedNoteId, setSelectedNoteId, updateNote, togglePin } = useNotesStore()
  const { toast } = useToast()

  const activeNote = notes.find((n) => n.id === selectedNoteId)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title)
      setContent(activeNote.content)
    }
  }, [activeNote?.id])

  const handleSave = () => {
    if (activeNote) {
      updateNote(activeNote.id, { title, content })
      toast({ title: 'Nota salva' })
    }
  }

  const insertMarkdown = (syntax: string) => {
    setContent((prev) => prev + syntax)
  }

  if (!activeNote) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-background text-muted-foreground">
        <div className="text-center animate-fade-in-up">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <List className="w-8 h-8 opacity-50" />
          </div>
          <p>Selecione uma nota ou crie uma nova.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex-1 flex flex-col bg-background h-full animate-fade-in',
        !selectedNoteId ? 'hidden md:flex' : 'flex',
      )}
    >
      {/* Mobile Header */}
      <div className="md:hidden flex items-center p-2 border-b">
        <Button variant="ghost" size="sm" onClick={() => setSelectedNoteId(null)}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
      </div>

      {/* Toolbar */}
      <div className="h-12 border-b flex items-center justify-between px-4 bg-muted/30">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => insertMarkdown('**negrito**')}
              >
                <Bold className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Negrito</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => insertMarkdown('*itálico*')}
              >
                <Italic className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Itálico</TooltipContent>
          </Tooltip>
          <div className="w-px h-4 bg-border mx-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => insertMarkdown('\n- ')}
              >
                <List className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Lista</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => insertMarkdown('\n1. ')}
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Lista Numerada</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => insertMarkdown('[link](url)')}
              >
                <Link2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Link</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('w-8 h-8', activeNote.isPinned && 'text-primary')}
                onClick={() => togglePin(activeNote.id)}
              >
                <Pin className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{activeNote.isPinned ? 'Desfixar' : 'Fixar'}</TooltipContent>
          </Tooltip>
          <Button size="sm" onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Salvar</span>
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col p-6 md:p-10 max-w-4xl mx-auto w-full overflow-hidden">
        <input
          type="text"
          placeholder="Título da Nota"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-3xl md:text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 mb-6"
        />
        <Textarea
          placeholder="Comece a escrever aqui..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 text-base md:text-lg resize-none border-none focus-visible:ring-0 p-0 bg-transparent leading-relaxed"
        />
      </div>
    </div>
  )
}
