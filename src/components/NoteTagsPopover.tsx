import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tag as TagIcon, Plus, Check, X } from 'lucide-react'
import { Tag } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NoteTagsPopoverProps {
  tags: Tag[]
  noteTags: Tag[]
  onAddTag: (tagId: string) => void
  onRemoveTag: (tagId: string) => void
  onCreateTag: (name: string, color: string) => void
}

const COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#64748b',
]

export function NoteTagsPopover({
  tags,
  noteTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
}: NoteTagsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = () => {
    if (newTagName.trim()) {
      onCreateTag(newTagName.trim(), selectedColor)
      setNewTagName('')
      setIsCreating(false)
    }
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) setIsCreating(false)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 min-h-8 min-w-8 md:min-h-8 md:min-w-8"
        >
          <TagIcon className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        {!isCreating ? (
          <div className="space-y-2 animate-fade-in">
            <div className="font-semibold text-sm px-2 pb-2 border-b">Tags da Nota</div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto p-1">
              {tags.length === 0 && (
                <p className="text-xs text-muted-foreground px-1 py-2">Nenhuma tag criada.</p>
              )}
              {tags.map((tag) => {
                const isActive = noteTags.some((t) => t.id === tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => (isActive ? onRemoveTag(tag.id) : onAddTag(tag.id))}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate">{tag.name}</span>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="w-4 h-4" /> Nova Tag
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-1 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Criar Tag</span>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => setIsCreating(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Input
              placeholder="Nome da tag"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            <div className="flex flex-wrap gap-2 py-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all',
                    selectedColor === color ? 'border-primary' : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              className="w-full h-8"
              onClick={handleCreate}
              disabled={!newTagName.trim()}
            >
              Salvar Tag
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
