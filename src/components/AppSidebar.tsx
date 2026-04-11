import {
  FolderPlus,
  ScanLine,
  KeyRound,
  Activity,
  FileText,
  Library,
  ChevronRight,
  Pin,
  Clock,
  Lock,
  Unlock,
  Settings,
  Trash2,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useNotesStore from '@/stores/useNotesStore'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

function TagEditRow({ tag, onUpdate, onDelete }: { tag: any; onUpdate: any; onDelete: any }) {
  const [name, setName] = useState(tag.name)
  const [color, setColor] = useState(tag.color)

  useEffect(() => {
    setName(tag.name)
    setColor(tag.color)
  }, [tag.name, tag.color])

  const handleSave = () => {
    if (name !== tag.name || color !== tag.color) {
      onUpdate(tag.id, name, color)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        onBlur={handleSave}
        className="w-12 h-9 p-1 shrink-0 cursor-pointer"
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        className="flex-1"
        placeholder="Nome da tag"
      />
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
        onClick={() => onDelete(tag.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setOpenMobile } = useSidebar()
  const {
    folders,
    notes,
    tags,
    selectedFolderId,
    setSelectedFolderId,
    addFolder,
    setSelectedNoteId,
    unlockedNotes,
    removeUnlockedNote,
    updateTag,
    deleteTag,
    toggleTagFilter,
    selectedTagIds,
  } = useNotesStore()

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isManageTagsModalOpen, setIsManageTagsModalOpen] = useState(false)

  const pinnedNotes = notes.filter((n) => n.isPinned)
  const rootFolders = folders.filter((f) => !f.parentId)

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    addFolder({
      name: newFolderName,
      parentId: selectedFolderId || (rootFolders.length > 0 ? rootFolders[0].id : null),
    })
    setNewFolderName('')
    setIsFolderModalOpen(false)
    toast({ title: 'Pasta criada com sucesso!' })
  }

  const handleLinkClick = () => {
    setOpenMobile(false)
  }

  const handleNoteClick = (id: string, folderId: string) => {
    navigate('/')
    setSelectedFolderId(folderId)
    setSelectedNoteId(id)
    setOpenMobile(false)
  }

  return (
    <>
      <Sidebar variant="inset" className="hidden md:flex border-r">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegação Global</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/'}>
                    <Link to="/" onClick={handleLinkClick}>
                      <FileText /> Editor de Notas
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/scanner'}>
                    <Link to="/scanner" onClick={handleLinkClick}>
                      <ScanLine /> Scanner OCR
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/meus-scans'}>
                    <Link to="/meus-scans" onClick={handleLinkClick}>
                      <Library /> Meus Scans
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/secrets'}>
                    <Link to="/secrets" onClick={handleLinkClick}>
                      <KeyRound /> Secrets Manager
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/audit'}>
                    <Link to="/audit" onClick={handleLinkClick}>
                      <Activity /> Log de Auditoria
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/timesheet'}>
                    <Link to="/timesheet" onClick={handleLinkClick}>
                      <Clock /> Banco de Horas
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {pinnedNotes.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Fixados</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {pinnedNotes.map((note) => {
                    const isUnlocked = unlockedNotes.includes(note.id)
                    return (
                      <SidebarMenuItem key={note.id}>
                        <SidebarMenuButton onClick={() => handleNoteClick(note.id, note.folderId)}>
                          {note.isLocked ? (
                            isUnlocked ? (
                              <Unlock
                                className="w-4 h-4 text-primary hover:text-destructive transition-colors shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeUnlockedNote(note.id)
                                }}
                              />
                            ) : (
                              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                            )
                          ) : (
                            <Pin className="w-4 h-4 rotate-45 text-primary shrink-0" />
                          )}
                          <span className="truncate">{note.title || 'Sem título'}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup>
            <div className="flex items-center justify-between pr-2">
              <SidebarGroupLabel>Minhas Pastas</SidebarGroupLabel>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setIsFolderModalOpen(true)}
              >
                <FolderPlus className="h-3 w-3" />
              </Button>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {rootFolders.map((root) => (
                  <SidebarMenuItem key={root.id}>
                    <SidebarMenuButton
                      isActive={selectedFolderId === root.id && location.pathname === '/'}
                      onClick={() => {
                        navigate('/')
                        setSelectedFolderId(root.id)
                        setOpenMobile(false)
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                      {root.name}
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {folders
                        .filter((f) => f.parentId === root.id)
                        .map((child) => (
                          <SidebarMenuSubItem key={child.id}>
                            <SidebarMenuSubButton
                              isActive={selectedFolderId === child.id && location.pathname === '/'}
                              onClick={() => {
                                navigate('/')
                                setSelectedFolderId(child.id)
                                setOpenMobile(false)
                              }}
                            >
                              {child.name}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <div className="flex items-center justify-between pr-2">
              <SidebarGroupLabel>Tags</SidebarGroupLabel>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setIsManageTagsModalOpen(true)}
              >
                <Settings className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
              </Button>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {tags.map((tag) => (
                  <SidebarMenuItem key={tag.id}>
                    <SidebarMenuButton
                      isActive={selectedTagIds.includes(tag.id)}
                      onClick={() => {
                        navigate('/')
                        toggleTagFilter(tag.id)
                        setOpenMobile(false)
                      }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate">{tag.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {tags.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Nenhuma tag criada</div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome da pasta..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFolderModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isManageTagsModalOpen} onOpenChange={setIsManageTagsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Tags</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              {tags.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">
                  Você ainda não tem tags cadastradas.
                </div>
              ) : (
                tags.map((tag) => (
                  <TagEditRow key={tag.id} tag={tag} onUpdate={updateTag} onDelete={deleteTag} />
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
