import {
  FolderPlus,
  ScanLine,
  KeyRound,
  Activity,
  FileText,
  ChevronRight,
  Pin,
  Clock,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
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

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { folders, notes, selectedFolderId, setSelectedFolderId, addFolder, setSelectedNoteId } =
    useNotesStore()

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

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

  const handleNoteClick = (id: string, folderId: string) => {
    navigate('/')
    setSelectedFolderId(folderId)
    setSelectedNoteId(id)
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
                    <Link to="/">
                      <FileText /> Editor de Notas
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/scanner'}>
                    <Link to="/scanner">
                      <ScanLine /> Scanner OCR
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/secrets'}>
                    <Link to="/secrets">
                      <KeyRound /> Secrets Manager
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/audit'}>
                    <Link to="/audit">
                      <Activity /> Log de Auditoria
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/timesheet'}>
                    <Link to="/timesheet">
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
                  {pinnedNotes.map((note) => (
                    <SidebarMenuItem key={note.id}>
                      <SidebarMenuButton onClick={() => handleNoteClick(note.id, note.folderId)}>
                        <Pin className="w-4 h-4 rotate-45 text-primary" />
                        <span className="truncate">{note.title || 'Sem título'}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
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
    </>
  )
}
