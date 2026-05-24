import { useState, useEffect, Dispatch, SetStateAction } from 'react'
import { supabase } from '@/lib/supabase/client'

export type SecretType = string

export interface AppSecret {
  id: string
  name: string
  value: string
  type: SecretType
  createdAt: string
  platform?: string | null
  url?: string | null
  username?: string | null
  environment?: string | null
  passwordOrigin?: string | null
  recoveryPhrase?: string | null
  notes?: string | null
  updatedAt?: string | null
  deletedAt?: string | null
  deletedBy?: string | null
}

export interface AuditLog {
  id: string
  action: string
  secretName: string
  date: string
  status: string
}

type GlobalState = {
  secrets: AppSecret[]
  trashSecrets: AppSecret[]
  auditLogs: AuditLog[]
  loading: boolean
  trashLoading: boolean
}

let globalState: GlobalState = {
  secrets: [],
  trashSecrets: [],
  auditLogs: [],
  loading: false,
  trashLoading: false,
}

const listeners = new Set<Dispatch<SetStateAction<GlobalState>>>()

function notify() {
  listeners.forEach((listener) => listener(globalState))
}

let isFetching = false
let isFetchingTrash = false

const mapSecret = (s: any): AppSecret => ({
  id: s.id,
  name: s.name,
  value: s.value,
  type: s.category,
  createdAt: s.created_at,
  platform: s.platform,
  url: s.url,
  username: s.username,
  environment: s.environment,
  passwordOrigin: s.password_origin,
  recoveryPhrase: s.recovery_phrase,
  notes: s.notes,
  updatedAt: s.updated_at,
  deletedAt: s.deleted_at,
  deletedBy: s.deleted_by,
})

export default function useSecretsStore() {
  const [state, setState] = useState(globalState)

  useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])

  const fetchSecrets = async () => {
    if (isFetching) return
    isFetching = true

    globalState = { ...globalState, loading: true }
    notify()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      globalState = { ...globalState, loading: false }
      notify()
      isFetching = false
      return
    }

    const { data, error } = await supabase
      .from('secrets')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (!error && data) {
      globalState = {
        ...globalState,
        secrets: data.map(mapSecret),
        loading: false,
      }
    } else {
      globalState = { ...globalState, loading: false }
    }
    notify()
    isFetching = false
  }

  const fetchTrashSecrets = async () => {
    if (isFetchingTrash) return
    isFetchingTrash = true

    globalState = { ...globalState, trashLoading: true }
    notify()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      globalState = { ...globalState, trashLoading: false }
      notify()
      isFetchingTrash = false
      return
    }

    const { data, error } = await supabase
      .from('secrets')
      .select('*')
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (!error && data) {
      globalState = {
        ...globalState,
        trashSecrets: data.map(mapSecret),
        trashLoading: false,
      }
    } else {
      globalState = { ...globalState, trashLoading: false }
    }
    notify()
    isFetchingTrash = false
  }

  const addSecret = async (
    secretData: Omit<AppSecret, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'deletedBy'>,
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado.')

    const { data, error } = await supabase
      .from('secrets')
      .insert({
        user_id: user.id,
        name: secretData.name,
        value: secretData.value,
        category: secretData.type,
        platform: secretData.platform,
        url: secretData.url,
        username: secretData.username,
        environment: secretData.environment,
        password_origin: secretData.passwordOrigin,
        recovery_phrase: secretData.recoveryPhrase,
        notes: secretData.notes,
      })
      .select()
      .single()

    if (error) throw error

    const newSecret = mapSecret(data)

    globalState = { ...globalState, secrets: [newSecret, ...globalState.secrets] }
    notify()

    return newSecret
  }

  const updateSecret = async (id: string, updatedData: Partial<AppSecret>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado.')

    const payload: any = {}
    if (updatedData.name !== undefined) payload.name = updatedData.name
    if (updatedData.value !== undefined) payload.value = updatedData.value
    if (updatedData.type !== undefined) payload.category = updatedData.type
    if (updatedData.platform !== undefined) payload.platform = updatedData.platform
    if (updatedData.url !== undefined) payload.url = updatedData.url
    if (updatedData.username !== undefined) payload.username = updatedData.username
    if (updatedData.environment !== undefined) payload.environment = updatedData.environment
    if (updatedData.passwordOrigin !== undefined)
      payload.password_origin = updatedData.passwordOrigin
    if (updatedData.recoveryPhrase !== undefined)
      payload.recovery_phrase = updatedData.recoveryPhrase
    if (updatedData.notes !== undefined) payload.notes = updatedData.notes

    const { data, error } = await supabase
      .from('secrets')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    globalState = {
      ...globalState,
      secrets: globalState.secrets.map((s) => (s.id === id ? mapSecret(data) : s)),
    }
    notify()
    return mapSecret(data)
  }

  const moveSecretToTrash = async (id: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado.')

    const { data, error } = await supabase
      .from('secrets')
      .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    const trashedSecret = mapSecret(data)

    globalState = {
      ...globalState,
      secrets: globalState.secrets.filter((s) => s.id !== id),
      trashSecrets: [trashedSecret, ...globalState.trashSecrets],
    }
    notify()
    return trashedSecret
  }

  const restoreSecret = async (id: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado.')

    const { data, error } = await supabase
      .from('secrets')
      .update({ deleted_at: null, deleted_by: null })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    const restoredSecret = mapSecret(data)

    globalState = {
      ...globalState,
      trashSecrets: globalState.trashSecrets.filter((s) => s.id !== id),
      secrets: [restoredSecret, ...globalState.secrets],
    }
    notify()
    return restoredSecret
  }

  const permanentlyDeleteSecret = async (id: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado.')

    const { error } = await supabase
      .from('secrets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)

    if (error) throw error

    globalState = {
      ...globalState,
      trashSecrets: globalState.trashSecrets.filter((s) => s.id !== id),
    }
    notify()
  }

  const logAudit = async (
    action:
      | 'view'
      | 'copy'
      | 'create'
      | 'update'
      | 'delete'
      | 'moved_to_trash'
      | 'restored_from_trash'
      | 'permanently_deleted',
    secretId: string,
    details?: any,
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('secret_access_logs').insert({
      user_id: user.id,
      secret_id: secretId,
      action,
      details,
    })

    if (error) console.error('Erro ao registrar log de auditoria', error)
  }

  return {
    ...state,
    fetchSecrets,
    fetchTrashSecrets,
    addSecret,
    updateSecret,
    moveSecretToTrash,
    restoreSecret,
    permanentlyDeleteSecret,
    logAudit,
  }
}
