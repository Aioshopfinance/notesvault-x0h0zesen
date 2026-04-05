import { useState, useEffect, Dispatch, SetStateAction } from 'react'

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

let globalState = {
  secrets: [
    {
      id: '1',
      name: 'AWS Production',
      value: 'AKIAIOSFODNN7EXAMPLE',
      type: 'API Key',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '2',
      name: 'Banco de Dados Main',
      value: 'senhaSuperSegura123!@#',
      type: 'Login',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: '3',
      name: 'Chave SSH Github',
      value: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...',
      type: 'Outro',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
  ] as AppSecret[],
  auditLogs: [
    {
      id: '1',
      action: 'Criação',
      secretName: 'AWS Production',
      date: new Date(Date.now() - 86400000).toISOString(),
      status: 'Sucesso',
    },
    {
      id: '2',
      action: 'Visualização',
      secretName: 'Banco de Dados Main',
      date: new Date().toISOString(),
      status: 'Sucesso',
    },
  ] as AuditLog[],
}

const listeners = new Set<Dispatch<SetStateAction<typeof globalState>>>()

function notify() {
  listeners.forEach((listener) => listener(globalState))
}

export default function useSecretsStore() {
  const [state, setState] = useState(globalState)

  useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])

  return {
    ...state,
    addSecret: (secret: AppSecret) => {
      globalState = { ...globalState, secrets: [secret, ...globalState.secrets] }
      notify()
    },
    updateSecret: (id: string, updatedData: Partial<AppSecret>) => {
      globalState = {
        ...globalState,
        secrets: globalState.secrets.map((s) => (s.id === id ? { ...s, ...updatedData } : s)),
      }
      notify()
    },
    deleteSecret: (id: string) => {
      globalState = {
        ...globalState,
        secrets: globalState.secrets.filter((s) => s.id !== id),
      }
      notify()
    },
    logAudit: (log: Omit<AuditLog, 'id' | 'date'>) => {
      const newLog = {
        ...log,
        id: Date.now().toString(),
        date: new Date().toISOString(),
      }
      globalState = { ...globalState, auditLogs: [newLog, ...globalState.auditLogs] }
      notify()
    },
  }
}
