import { useState, useEffect } from 'react'
import { Secret, AuditLog } from '@/lib/types'

let globalState = {
  secrets: [
    { id: '1', name: 'AWS Production', value: 'AKIAIOSFODNN7EXAMPLE', category: 'API Keys' },
    { id: '2', name: 'Banco de Dados Main', value: 'senhaSuperSegura123!@#', category: 'Senhas' },
    {
      id: '3',
      name: 'Chave SSH Github',
      value: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...',
      category: 'Chaves',
    },
  ] as Secret[],
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

const listeners = new Set<Function>()

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
    addSecret: (secret: Secret) => {
      globalState = { ...globalState, secrets: [secret, ...globalState.secrets] }
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
