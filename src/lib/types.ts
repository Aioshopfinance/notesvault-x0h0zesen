export interface Folder {
  id: string
  name: string
  parentId: string | null
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Note {
  id: string
  title: string
  content: string
  folderId: string
  isPinned: boolean
  isLocked: boolean
  lockPassword?: string | null
  updatedAt: string
  tags?: Tag[]
}
