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

export interface Secret {
  id: string
  name: string
  value: string
  category: string
}

export interface AuditLog {
  id: string
  action: string
  secretName: string
  date: string
  status: string
}
