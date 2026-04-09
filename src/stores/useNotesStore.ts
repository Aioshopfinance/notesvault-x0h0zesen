import { useState, useEffect, Dispatch, SetStateAction } from 'react'
import { Note, Folder, Tag } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'

interface NotesState {
  folders: Folder[]
  notes: Note[]
  tags: Tag[]
  selectedFolderId: string | null
  selectedNoteId: string | null
  isLoading: boolean
  unlockedNotes: string[]
}

let globalState: NotesState = {
  folders: [],
  notes: [],
  tags: [],
  selectedFolderId: null,
  selectedNoteId: null,
  isLoading: true,
  unlockedNotes: [],
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

      const [foldersRes, notesRes, tagsRes, noteTagsRes] = await Promise.all([
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
        supabase.from('tags').select('*').eq('user_id', userId),
        supabase.from('note_tags').select('*'),
      ])

      const folders: Folder[] = (foldersRes.data || []).map((f) => ({
        id: f.id,
        name: f.name,
        parentId: f.parent_folder_id,
      }))

      const tags: Tag[] = (tagsRes.data || []).map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
      }))

      const noteTags = noteTagsRes.data || []

      const notes: Note[] = (notesRes.data || []).map((n) => {
        const nTags = noteTags.filter((nt) => nt.note_id === n.id).map((nt) => nt.tag_id)
        return {
          id: n.id,
          title: n.title,
          content: n.content,
          folderId: n.folder_id,
          isPinned: n.is_pinned,
          isLocked: n.is_locked || false,
          lockPassword: n.lock_password,
          updatedAt: n.updated_at,
          tags: tags.filter((t) => nTags.includes(t.id)),
        }
      })

      globalState = {
        ...globalState,
        folders,
        notes,
        tags,
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
        tags: [],
        selectedFolderId: null,
        selectedNoteId: null,
        isLoading: false,
        unlockedNotes: [],
      }
      notify()
    },

    setSelectedFolderId: (id: string | null) => {
      globalState = { ...globalState, selectedFolderId: id, selectedNoteId: null }
      notify()
    },

    setSelectedNoteId: (id: string | null) => {
      globalState = {
        ...globalState,
        selectedNoteId: id,
      }
      notify()
    },

    setUnlockedNote: (id: string) => {
      if (!globalState.unlockedNotes.includes(id)) {
        globalState = { ...globalState, unlockedNotes: [...globalState.unlockedNotes, id] }
        notify()
      }
    },

    removeUnlockedNote: (id: string) => {
      globalState = {
        ...globalState,
        unlockedNotes: globalState.unlockedNotes.filter((noteId) => noteId !== id),
      }
      notify()
    },

    lockNote: async (id: string, isLocked: boolean) => {
      globalState = {
        ...globalState,
        notes: globalState.notes.map((n) => (n.id === id ? { ...n, isLocked } : n)),
      }
      notify()
      await supabase.from('notes').update({ is_locked: isLocked }).eq('id', id)
    },

    verifyMasterPassword: async (password: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false
      const { data } = await supabase
        .from('user_preferences')
        .select('master_password')
        .eq('id', user.id)
        .single()
      return !!data && data.master_password === password
    },

    createTag: async (name: string, color: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null

      const { data } = await supabase
        .from('tags')
        .insert({ user_id: user.id, name, color })
        .select()
        .single()

      if (data) {
        const newTag: Tag = { id: data.id, name: data.name, color: data.color }
        globalState = { ...globalState, tags: [...globalState.tags, newTag] }
        notify()
        return newTag
      }
      return null
    },

    addTagToNote: async (noteId: string, tagId: string) => {
      const note = globalState.notes.find((n) => n.id === noteId)
      const tag = globalState.tags.find((t) => t.id === tagId)
      if (note && tag && !note.tags?.some((t) => t.id === tagId)) {
        const updatedTags = [...(note.tags || []), tag]
        globalState = {
          ...globalState,
          notes: globalState.notes.map((n) => (n.id === noteId ? { ...n, tags: updatedTags } : n)),
        }
        notify()
        await supabase.from('note_tags').insert({ note_id: noteId, tag_id: tagId })
      }
    },

    removeTagFromNote: async (noteId: string, tagId: string) => {
      const note = globalState.notes.find((n) => n.id === noteId)
      if (note) {
        const updatedTags = (note.tags || []).filter((t) => t.id !== tagId)
        globalState = {
          ...globalState,
          notes: globalState.notes.map((n) => (n.id === noteId ? { ...n, tags: updatedTags } : n)),
        }
        notify()
        await supabase.from('note_tags').delete().match({ note_id: noteId, tag_id: tagId })
      }
    },

    addNote: async (note: Omit<Note, 'id' | 'updatedAt' | 'isLocked' | 'tags'>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          folder_id: note.folderId,
          title: note.title,
          content: note.content,
          is_pinned: note.isPinned,
          is_locked: false,
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
          isLocked: data.is_locked,
          updatedAt: data.updated_at,
          tags: [],
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

      const { data } = await supabase
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

  return { ...state, ...api }
}
