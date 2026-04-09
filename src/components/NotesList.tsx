import { Plus, Pin, Lock, Unlock, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import useNotesStore from '@/stores/useNotesStore'

export function NotesList() {
  const {
    notes,
    tags,
    selectedFolderId,
    selectedNoteId,
    setSelectedNoteId,
    addNote,
    isLoading,
    unlockedNotes,
    searchQuery,
    setSearchQuery,
    selectedTagIds,
    toggleTagFilter,
  } = useNotesStore()

  const filteredNotes = notes
    .filter((n) => n.folderId === selectedFolderId)
    .filter((n) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
    })
    .filter((n) => {
      if (selectedTagIds.length === 0) return true
      if (!n.tags) return false
      return n.tags.some((tag) => selectedTagIds.includes(tag.id))
    })
    .sort((a, b) => {
      if (a.isPinned === b.isPinned)
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      return a.isPinned ? -1 : 1
    })

  const handleNewNote = () => {
    if (!selectedFolderId) return
    addNote({
      title: '',
      content: '',
      folderId: selectedFolderId,
      isPinned: false,
    })
  }

  return (
    <div
      className={cn(
        'w-full md:w-80 border-r flex-col bg-muted/10 h-full',
        selectedNoteId ? 'hidden md:flex' : 'flex',
      )}
    >
      <div className="p-4 border-b flex items-center justify-between bg-background/50 backdrop-blur-sm z-10">
        <h2 className="font-semibold tracking-tight">Notas</h2>
        <Button size="sm" variant="outline" onClick={handleNewNote} disabled={!selectedFolderId}>
          <Plus className="w-4 h-4 mr-1" /> Nova
        </Button>
      </div>

      <div className="p-3 border-b space-y-3 bg-background/30 backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notas..."
            className="pl-9 h-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {selectedTagIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedTagIds.map((tagId) => {
              const tag = tags.find((t) => t.id === tagId)
              if (!tag) return null
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTagFilter(tag.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-colors hover:opacity-80 border"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    borderColor: `${tag.color}40`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                  <X className="w-3 h-3" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground text-sm animate-pulse">
              Carregando notas...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Nenhuma nota encontrada.
            </div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-colors border outline-none focus-visible:ring-2 ring-ring',
                  selectedNoteId === note.id
                    ? 'bg-primary/10 border-primary/20'
                    : 'bg-background border-transparent hover:border-border hover:bg-muted/50',
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium truncate pr-2 text-sm text-foreground">
                    {note.title || 'Sem título'}
                  </span>
                  {note.isPinned && <Pin className="w-3 h-3 text-primary shrink-0 mt-1" />}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2 opacity-80">
                  {note.isLocked ? (
                    unlockedNotes.includes(note.id) ? (
                      <div className="flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{note.content || 'Sem conteúdo'}</span>
                      </div>
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )
                  ) : (
                    note.content || 'Sem conteúdo'
                  )}
                </div>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                        title={tag.name}
                      />
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-muted-foreground/60 mt-2 font-medium">
                  {new Date(note.updatedAt).toLocaleDateString('pt-BR')}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
