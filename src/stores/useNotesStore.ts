import { useState, useEffect } from 'react'
import { Note, Folder } from '@/lib/types'

const defaultFolders: Folder[] = [
  { id: '1', name: 'Minhas Notas', parentId: null },
  { id: '2', name: 'Trabalho', parentId: '1' },
  { id: '3', name: 'Pessoal', parentId: '1' },
]

const defaultNotes: Note[] = [
  {
    id: '1',
    title: 'Reunião de Planejamento Q3',
    content:
      'Metas atingidas e próximos passos:\n- Revisar orçamento\n- Contratar novos devs\n- Lançar v2.0',
    folderId: '2',
    isPinned: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Ideias de Projeto',
    content: 'Usar React com Vite e Shadcn UI parece uma ótima combinação para o novo MVP.',
    folderId: '2',
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Lista de Compras',
    content: '- Leite\n- Ovos\n- Pão integral\n- Café (MUITO CAFÉ)',
    folderId: '3',
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
]

let globalState = {
  folders: defaultFolders,
  notes: defaultNotes,
  selectedFolderId: '1' as string | null,
  selectedNoteId: null as string | null,
}

const listeners = new Set<Function>()

function notify() {
  listeners.forEach((listener) => listener(globalState))
}

export default function useNotesStore() {
  const [state, setState] = useState(globalState)

  useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])

  return {
    ...state,
    setSelectedFolderId: (id: string | null) => {
      globalState = { ...globalState, selectedFolderId: id, selectedNoteId: null }
      notify()
    },
    setSelectedNoteId: (id: string | null) => {
      globalState = { ...globalState, selectedNoteId: id }
      notify()
    },
    addNote: (note: Note) => {
      globalState = { ...globalState, notes: [note, ...globalState.notes] }
      notify()
    },
    updateNote: (id: string, updates: Partial<Note>) => {
      globalState = {
        ...globalState,
        notes: globalState.notes.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n,
        ),
      }
      notify()
    },
    addFolder: (folder: Folder) => {
      globalState = { ...globalState, folders: [...globalState.folders, folder] }
      notify()
    },
    togglePin: (id: string) => {
      globalState = {
        ...globalState,
        notes: globalState.notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)),
      }
      notify()
    },
  }
}
