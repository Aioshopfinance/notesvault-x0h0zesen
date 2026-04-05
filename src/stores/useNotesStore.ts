import { useState, useEffect, Dispatch, SetStateAction } from 'react'
import { Note, Folder } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'

interface NotesState {
  folders: Folder[]
  notes: Note[]
  selectedFolderId: string | null
  selectedNoteId: string | null
  isLoading: boolean
}

let globalState: NotesState = {
  folders: [],
  notes: [],
  selectedFolderId: null,
  selectedNoteId: null,
  isLoading: true,
}

const listeners = new Set<Dispatch<SetStateAction<NotesState>>>()

function notify() {
  listeners.forEach((listener) => listener(globalState))
}

let initialized = false

export default function useNotesStore() {
  const [state, setState] = useState(globalState)

  const api = {
    fetchData: async (userId: string) => {
      globalState = { ...globalState, isLoading: true }
      notify()

      const [foldersRes, notesRes] = await Promise.all([
        supabase
          .from('folders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true }),
        supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false }),
      ])

      const folders: Folder[] = (foldersRes.data || []).map((f) => ({
        id: f.id,
        name: f.name,
        parentId: f.parent_folder_id,
      }))

      const notes: Note[] = (notesRes.data || []).map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        folderId: n.folder_id,
        isPinned: n.is_pinned,
        updatedAt: n.updated_at,
      }))

      globalState = {
        ...globalState,
        folders,
        notes,
        isLoading: false,
        selectedFolderId:
          folders.length > 0 && !globalState.selectedFolderId
            ? folders[0].id
            : globalState.selectedFolderId,
      }
      notify()
    },

    clearData: () => {
      globalState = {
        folders: [],
        notes: [],
        selectedFolderId: null,
        selectedNoteId: null,
        isLoading: false,
      }
      notify()
    },

    setSelectedFolderId: (id: string | null) => {
      globalState = { ...globalState, selectedFolderId: id, selectedNoteId: null }
      notify()
    },

    setSelectedNoteId: (id: string | null) => {
      globalState = { ...globalState, selectedNoteId: id }
      notify()
    },

    addNote: async (note: Omit<Note, 'id' | 'updatedAt'>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          folder_id: note.folderId,
          title: note.title,
          content: note.content,
          is_pinned: note.isPinned,
        })
        .select()
        .single()

      if (data) {
        const newNote: Note = {
          id: data.id,
          title: data.title,
          content: data.content,
          folderId: data.folder_id,
          isPinned: data.is_pinned,
          updatedAt: data.updated_at,
        }
        globalState = {
          ...globalState,
          notes: [newNote, ...globalState.notes],
          selectedNoteId: newNote.id,
        }
        notify()
      }
    },

    updateNote: async (id: string, updates: Partial<Note>) => {
      const dbUpdates: any = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.content !== undefined) dbUpdates.content = updates.content
      if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId
      if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned
      dbUpdates.updated_at = new Date().toISOString()

      // Optimistic update
      globalState = {
        ...globalState,
        notes: globalState.notes.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: dbUpdates.updated_at } : n,
        ),
      }
      notify()

      await supabase.from('notes').update(dbUpdates).eq('id', id)
    },

    addFolder: async (folder: Omit<Folder, 'id'>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          name: folder.name,
          parent_folder_id: folder.parentId,
        })
        .select()
        .single()

      if (data) {
        const newFolder: Folder = {
          id: data.id,
          name: data.name,
          parentId: data.parent_folder_id,
        }
        globalState = { ...globalState, folders: [...globalState.folders, newFolder] }

        if (!globalState.selectedFolderId) {
          globalState.selectedFolderId = newFolder.id
        }
        notify()
      }
    },

    togglePin: async (id: string) => {
      const note = globalState.notes.find((n) => n.id === id)
      if (note) {
        const newIsPinned = !note.isPinned

        // Optimistic update
        globalState = {
          ...globalState,
          notes: globalState.notes.map((n) => (n.id === id ? { ...n, isPinned: newIsPinned } : n)),
        }
        notify()

        await supabase
          .from('notes')
          .update({
            is_pinned: newIsPinned,
            pinned_at: newIsPinned ? new Date().toISOString() : null,
          })
          .eq('id', id)
      }
    },
  }

  useEffect(() => {
    listeners.add(setState)

    if (!initialized) {
      initialized = true

      const fetchInitialData = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          api.fetchData(session.user.id)
        } else {
          api.clearData()
        }
      }

      fetchInitialData()

      supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          api.fetchData(session.user.id)
        } else {
          api.clearData()
        }
      })
    }

    return () => {
      listeners.delete(setState)
    }
  }, [])

  return {
    ...state,
    ...api,
  }
}
