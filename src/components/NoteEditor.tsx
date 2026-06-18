import { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Bold, Italic, List, ListOrdered, Link2, Pin, X, Save, Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'cursor-pointer',
        },
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
  })

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title)
      setContent(activeNote.content)
      if (editor && editor.getHTML() !== activeNote.content) {
        editor.commands.setContent(activeNote.content || '')
      }
    } else {
      setTitle('')
      setContent('')
      if (editor) {
        editor.commands.setContent('')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNote?.id, editor])

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

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

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
                  className={cn(
                    'w-8 h-8 min-h-8 min-w-8 md:min-h-8 md:min-w-8',
                    editor?.isActive('bold') && 'bg-muted',
                  )}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
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
                  className={cn(
                    'w-8 h-8 min-h-8 min-w-8 md:min-h-8 md:min-w-8',
                    editor?.isActive('italic') && 'bg-muted',
                  )}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
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
                  className={cn(
                    'w-8 h-8 min-h-8 min-w-8 md:min-h-8 md:min-w-8',
                    editor?.isActive('bulletList') && 'bg-muted',
                  )}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
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
                  className={cn(
                    'w-8 h-8 min-h-8 min-w-8 md:min-h-8 md:min-w-8',
                    editor?.isActive('orderedList') && 'bg-muted',
                  )}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
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
                  className={cn(
                    'w-8 h-8 min-h-8 min-w-8 md:min-h-8 md:min-w-8',
                    editor?.isActive('link') && 'bg-muted',
                  )}
                  onClick={setLink}
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
          <div className="relative flex-1 overflow-y-auto">
            {editor?.isEmpty && (
              <div className="absolute top-0 left-0 text-muted-foreground/50 pointer-events-none">
                Comece a escrever aqui...
              </div>
            )}
            <EditorContent
              editor={editor}
              className="text-base md:text-lg leading-relaxed min-h-[150px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[150px] [&_.ProseMirror_p]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic [&_.ProseMirror_p:first-child]:mt-0"
            />
          </div>
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
