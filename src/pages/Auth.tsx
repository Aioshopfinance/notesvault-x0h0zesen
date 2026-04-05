import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Shield, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
})

const registerSchema = z
  .object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn, signUp, user, loading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const handleAuthError = (error: any, form: any) => {
    if (error?.message?.includes('Invalid login credentials')) {
      form.setError('root', { message: 'Credenciais inválidas. Verifique seu e-mail e senha.' })
      return
    }

    if (error?.message?.includes('User already registered')) {
      form.setError('email', { message: 'Este e-mail já está registrado.' })
      return
    }

    toast({
      variant: 'destructive',
      title: 'Erro na autenticação',
      description: error?.message || 'Ocorreu um erro ao processar sua solicitação.',
    })
  }

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true)
    loginForm.clearErrors('root')

    const { error } = await signIn(values.email, values.password)

    setIsSubmitting(false)

    if (error) {
      handleAuthError(error, loginForm)
      return
    }

    toast({
      title: 'Bem-vindo de volta!',
      description: 'Login realizado com sucesso.',
    })

    navigate('/')
  }

  const onRegister = async (values: z.infer<typeof registerSchema>) => {
    setIsSubmitting(true)
    registerForm.clearErrors('root')

    const { error } = await signUp(values.email, values.password)

    setIsSubmitting(false)

    if (error) {
      handleAuthError(error, registerForm)
      return
    }

    toast({
      title: 'Conta criada!',
      description: 'Sua conta foi criada com sucesso.',
    })

    navigate('/')
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
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          autoComplete="email"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-medium text-red-500" />
                    </FormItem>
                  )}
                />

                {loginForm.formState.errors.root && (
                  <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-500">
                    {loginForm.formState.errors.root.message}
                  </div>
                )}

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-medium text-red-500" />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? 'Entrando...' : 'Entrar'}
                </Button>

                <div className="mt-4 text-center text-sm">
                  <span className="text-muted-foreground">Não tem conta? </span>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="font-medium text-primary hover:underline disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    Registre-se
                  </button>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          autoComplete="email"
                          disabled={isSubmitting}
                          value={field.value || ''}
                          name={field.name}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage className="font-medium text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-medium text-red-500" />
                    </FormItem>
                  )}
                />

                {registerForm.formState.errors.root && (
                  <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-500">
                    {registerForm.formState.errors.root.message}
                  </div>
                )}

                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Repita sua senha"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-medium text-red-500" />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? 'Criando Conta...' : 'Criar Conta'}
                </Button>

                <div className="mt-4 text-center text-sm">
                  <span className="text-muted-foreground">Já tem conta? </span>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-medium text-primary hover:underline disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    Faça login
                  </button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
