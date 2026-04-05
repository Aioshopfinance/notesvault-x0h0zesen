export interface Folder {
  id: string
  name: string
  parentId: string | null
}

export interface Note {
  id: string
  title: string
  content: string
  folderId: string
  isPinned: boolean
  updatedAt: string
}
