import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { NotesList } from '@/components/NotesList'
import { NoteEditor } from '@/components/NoteEditor'
import useNotesStore from '@/stores/useNotesStore'

export default function Index() {
  const { folders, selectedFolderId } = useNotesStore()

  const currentFolder = folders.find((f) => f.id === selectedFolderId)
  const parentFolder = currentFolder?.parentId
    ? folders.find((f) => f.id === currentFolder.parentId)
    : null

  return (
    <div className="flex flex-col h-full w-full">
      <div className="h-10 border-b flex items-center px-4 bg-background shrink-0">
        <Breadcrumb>
          <BreadcrumbList>
            {parentFolder && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">{parentFolder.name}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{currentFolder?.name || 'Selecione uma pasta'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <NotesList />
        <NoteEditor />
      </div>
    </div>
  )
}
