import { useState, useEffect, Dispatch, SetStateAction } from 'react'
import { supabase } from '@/lib/supabase/client'

export type SecretType = 'API Key' | 'Email' | 'Login' | 'Token' | 'Outro' | string

export interface AppSecret {
  id: string
  name: string
  value: string
  type: SecretType
  createdAt: string
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
  auditLogs: AuditLog[]
  loading: boolean
}

let globalState: GlobalState = {
  secrets: [],
  auditLogs: [],
  loading: false,
}

const listeners = new Set<Dispatch<SetStateAction<GlobalState>>>()

function notify() {
  listeners.forEach((listener) => listener(globalState))
}

let isFetching = false

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
      .order('created_at', { ascending: false })

    if (!error && data) {
      globalState = {
        ...globalState,
        secrets: data.map((s) => ({
          id: s.id,
          name: s.name,
          value: s.value,
          type: s.category,
          createdAt: s.created_at,
        })),
        loading: false,
      }
    } else {
      globalState = { ...globalState, loading: false }
    }
    notify()
    isFetching = false
  }

  const addSecret = async (secretData: Omit<AppSecret, 'id' | 'createdAt'>) => {
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
      })
      .select()
      .single()

    if (error) throw error

    const newSecret: AppSecret = {
      id: data.id,
      name: data.name,
      value: data.value,
      type: data.category,
      createdAt: data.created_at,
    }

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
    if (updatedData.name) payload.name = updatedData.name
    if (updatedData.value) payload.value = updatedData.value
    if (updatedData.type) payload.category = updatedData.type

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
      secrets: globalState.secrets.map((s) =>
        s.id === id
          ? {
              ...s,
              name: data.name,
              value: data.value,
              type: data.category,
              createdAt: data.created_at,
            }
          : s,
      ),
    }
    notify()
    return data
  }

  const deleteSecret = async (id: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado.')

    const { error } = await supabase.from('secrets').delete().eq('id', id).eq('user_id', user.id)

    if (error) throw error

    globalState = {
      ...globalState,
      secrets: globalState.secrets.filter((s) => s.id !== id),
    }
    notify()
  }

  const logAudit = async (
    action: 'view' | 'copy' | 'create' | 'update' | 'delete',
    secretId: string,
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('secret_access_logs').insert({
      user_id: user.id,
      secret_id: secretId,
      action,
    })

    if (error) console.error('Erro ao registrar log de auditoria', error)
  }

  return {
    ...state,
    fetchSecrets,
    addSecret,
    updateSecret,
    deleteSecret,
    logAudit,
  }
}
