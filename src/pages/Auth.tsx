import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Shield, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const baseInputClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')

  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')

  const { signIn, signUp, user, loading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    if (!isValidEmail(loginEmail)) {
      setLoginError('Digite um e-mail válido.')
      return
    }

    if (!loginPassword.trim()) {
      setLoginError('Digite sua senha.')
      return
    }

    try {
      setIsSubmitting(true)

      const { error } = await signIn(loginEmail.trim(), loginPassword)

      if (error) {
        setLoginError(
          error.message?.includes('Invalid login credentials')
            ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
            : error.message || 'Erro ao fazer login.',
        )
        return
      }

      toast({
        title: 'Bem-vindo de volta!',
        description: 'Login realizado com sucesso.',
      })

      navigate('/')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError('')

    if (!isValidEmail(registerEmail)) {
      setRegisterError('Digite um e-mail válido.')
      return
    }

    if (registerPassword.length < 8) {
      setRegisterError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (!registerConfirmPassword) {
      setRegisterError('Confirme sua senha.')
      return
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('As senhas não coincidem.')
      return
    }

    try {
      setIsSubmitting(true)

      const { error } = await signUp(registerEmail.trim(), registerPassword)

      if (error) {
        setRegisterError(
          error.message?.includes('User already registered')
            ? 'Este e-mail já está registrado.'
            : error.message || 'Erro ao criar conta.',
        )
        return
      }

      toast({
        title: 'Conta criada!',
        description: 'Sua conta foi criada com sucesso.',
      })

      navigate('/')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg animate-fade-in-up">
        <CardHeader className="space-y-1 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight">NotesVault</CardTitle>

          <CardDescription>
            {mode === 'login'
              ? 'Faça login para acessar suas notas seguras'
              : 'Crie sua conta para começar a guardar suas notas'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={isSubmitting}
                  className={baseInputClassName}
                  data-skip-ignore="true"
                  style={{ pointerEvents: 'auto' }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={isSubmitting}
                  className={baseInputClassName}
                  data-skip-ignore="true"
                  style={{ pointerEvents: 'auto' }}
                />
              </div>

              {loginError ? (
                <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-500">
                  {loginError}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>

              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">Não tem conta? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register')
                    setLoginError('')
                  }}
                  className="font-medium text-primary hover:underline disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Registre-se
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="seu@email.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  disabled={isSubmitting}
                  className={baseInputClassName}
                  data-skip-ignore="true"
                  style={{ pointerEvents: 'auto' }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  disabled={isSubmitting}
                  className={baseInputClassName}
                  data-skip-ignore="true"
                  style={{ pointerEvents: 'auto' }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmar Senha</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita sua senha"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  className={baseInputClassName}
                  data-skip-ignore="true"
                  style={{ pointerEvents: 'auto' }}
                />
              </div>

              {registerError ? (
                <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-500">
                  {registerError}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Criando Conta...' : 'Criar Conta'}
              </Button>

              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">Já tem conta? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setRegisterError('')
                  }}
                  className="font-medium text-primary hover:underline disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Faça login
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
