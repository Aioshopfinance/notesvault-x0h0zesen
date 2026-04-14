import { useState, useEffect } from 'react'
import { Bold, Italic, List, ListOrdered, Link2, Pin, X, Save, Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import useNotesStore from '@/stores/useNotesStore'
import { useToast } from '@/hooks/use-toast'
import { NoteTagsPopover } from './NoteTagsPopover'
import { MasterPasswordDialog } from './MasterPasswordDialog'

export function NoteEditor() {
  const {
    notes,
    selectedNoteId,
    setSelectedNoteId,
    updateNote,
    togglePin,
    tags,
    createTag,
    addTagToNote,
    removeTagFromNote,
    unlockedNotes,
    setUnlockedNote,
    lockNote,
  } = useNotesStore()
  const { toast } = useToast()

  const activeNote = notes.find((n) => n.id === selectedNoteId)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isLockSettingsOpen, setIsLockSettingsOpen] = useState(false)

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title)
      setContent(activeNote.content)
    }
  }, [activeNote?.id])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNoteId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSelectedNoteId])

  const handleSave = () => {
    if (activeNote) {
      updateNote(activeNote.id, { title, content })
      toast({ title: 'Nota salva' })
    }
  }

  const insertMarkdown = (syntax: string) => {
    setContent((prev) => prev + syntax)
  }

  const handleLockSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeNote?.isLocked) {
      lockNote(activeNote.id, false)
      toast({ title: 'Bloqueio removido' })
    } else {
      lockNote(activeNote!.id, true)
      setUnlockedNote(activeNote!.id)
      toast({ title: 'Nota protegida com sucesso' })
    }
    setIsLockSettingsOpen(false)
  }

  if (!activeNote) {
    return (
      <div className="hidden lg:flex flex-1 items-center justify-center bg-background text-muted-foreground">
        <div className="text-center animate-fade-in-up">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <List className="w-8 h-8 opacity-50" />
          </div>
          <p>Selecione uma nota ou crie uma nova.</p>
        </div>
      </div>
    )
  }

  const isLockedAndRequiresPassword = activeNote.isLocked && !unlockedNotes.includes(activeNote.id)

  if (isLockedAndRequiresPassword) {
    return (
      <>
        <div className="hidden lg:flex flex-1 items-center justify-center bg-background text-muted-foreground">
          <div className="text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Lock className="w-8 h-8 opacity-50" />
            </div>
            <p>Esta nota está protegida por senha.</p>
          </div>
        </div>
        <MasterPasswordDialog
          open={true}
          onClose={() => setSelectedNoteId(null)}
          onSuccess={() => {
            if (activeNote) {
              setUnlockedNote(activeNote.id)
              toast({ title: 'Nota desbloqueada' })
            }
          }}
          title="Nota Bloqueada"
          description="Digite a senha mestre para acessar o conteúdo desta nota."
        />
      </>
    )
  }

  return (
    <>
      {selectedNoteId && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden animate-fade-in"
          onClick={() => setSelectedNoteId(null)}
        />
      )}

      <div
        className={cn(
          'bg-background animate-fade-in flex flex-col',
          selectedNoteId
            ? 'fixed inset-4 sm:inset-10 z-50 rounded-lg shadow-xl overflow-hidden'
            : 'hidden',
          'lg:static lg:flex lg:flex-1 lg:h-full lg:inset-auto lg:z-auto lg:rounded-none lg:shadow-none lg:w-auto w-full',
        )}
      >
        <div className="lg:hidden flex items-center justify-between p-2 border-b bg-muted/10">
          <span className="font-semibold px-2 truncate">{title || 'Nova Nota'}</span>
          <Button variant="ghost" size="icon" onClick={() => setSelectedNoteId(null)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="h-12 border-b flex items-center justify-between px-4 bg-muted/30 shrink-0 overflow-x-auto overflow-y-hidden">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 min-h-8 min-w-8 md:min-h-8 md:min-w-8"
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
                  className="w-8 h-8 min-h-8 min-w-8 md:min-h-8 md:min-w-8"
                  onClick={() => insertMarkdown('*itálico*')}
                >
                  <Italic className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Itálico</TooltipContent>
            </Tooltip>
            <div className="w-px h-4 bg-border mx-1 shrink-0" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 min-h-8 min-w-8 md:min-h-8 md:min-w-8"
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
                  className="w-8 h-8 min-h-8 min-w-8 md:min-h-8 md:min-w-8"
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
                  className="w-8 h-8 min-h-8 min-w-8 md:min-h-8 md:min-w-8"
                  onClick={() => insertMarkdown('[link](url)')}
                >
                  <Link2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Link</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <NoteTagsPopover
              tags={tags}
              noteTags={activeNote.tags || []}
              onAddTag={(tagId) => addTagToNote(activeNote.id, tagId)}
              onRemoveTag={(tagId) => removeTagFromNote(activeNote.id, tagId)}
              onCreateTag={(name, color) => createTag(name, color)}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'w-8 h-8 min-h-8 min-w-8 md:min-h-8 md:min-w-8',
                    activeNote.isLocked && 'text-primary',
                  )}
                  onClick={() => setIsLockSettingsOpen(true)}
                >
                  {activeNote.isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {activeNote.isLocked ? 'Remover Bloqueio' : 'Proteger Nota'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'w-8 h-8 min-h-8 min-w-8 md:min-h-8 md:min-w-8',
                    activeNote.isPinned && 'text-primary',
                  )}
                  onClick={() => togglePin(activeNote.id)}
                >
                  <Pin className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{activeNote.isPinned ? 'Desfixar' : 'Fixar'}</TooltipContent>
            </Tooltip>
            <Button size="sm" onClick={handleSave} className="gap-2 h-8 min-h-8 md:min-h-8 ml-1">
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Salvar</span>
            </Button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col p-4 md:p-10 max-w-4xl mx-auto w-full overflow-hidden">
          {activeNote.tags && activeNote.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {activeNote.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full text-white shadow-sm"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            placeholder="Título da Nota"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl md:text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 mb-4 md:mb-6 shrink-0"
          />
          <Textarea
            placeholder="Comece a escrever aqui..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 text-base md:text-lg resize-none border-none focus-visible:ring-0 p-0 bg-transparent leading-relaxed min-h-[150px]"
          />
        </div>
      </div>

      <Dialog open={isLockSettingsOpen} onOpenChange={setIsLockSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{activeNote.isLocked ? 'Remover Bloqueio' : 'Bloquear Nota'}</DialogTitle>
            <DialogDescription>
              {activeNote.isLocked
                ? 'Tem certeza que deseja remover a proteção por senha desta nota?'
                : 'Esta nota será protegida pela sua Senha Mestre. Certifique-se de tê-la configurado nas Configurações da conta.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLockSettingsSubmit} className="space-y-4">
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsLockSettingsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant={activeNote.isLocked ? 'destructive' : 'default'}>
                {activeNote.isLocked ? (
                  <>
                    <Unlock className="w-4 h-4 mr-2" /> Remover Proteção
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" /> Ativar Proteção
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
