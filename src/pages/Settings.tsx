import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setAvatarUrl(profile.avatar_url || '')
    }
    if (user) {
      setEmail(user.email || '')
      const fetchMasterPwd = async () => {
        const { data } = await (supabase as any)
          .from('user_preferences')
          .select('master_password')
          .eq('id', user.id)
          .single()
        if (data?.master_password) {
          setMasterPassword(data.master_password)
        }
      }
      fetchMasterPwd()
    }
  }, [profile, user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (password && password !== confirmPassword) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const updates: any = {}
      if (email !== user.email) updates.email = email
      if (password) updates.password = password

      if (Object.keys(updates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(updates)
        if (authError) throw authError
      }

      const { error: profileError } = await (supabase as any).from('user_preferences').upsert({
        id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        master_password: masterPassword,
        updated_at: new Date().toISOString(),
      })

      if (profileError) throw profileError

      await refreshProfile()
      setPassword('')
      setConfirmPassword('')

      toast({ title: 'Configurações salvas com sucesso!' })
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const initials = (fullName || email || 'US').substring(0, 2).toUpperCase()

  return (
    <div className="container max-w-2xl py-8 animate-fade-in-up">
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Conta</CardTitle>
          <CardDescription>Atualize suas informações de perfil e credenciais.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="w-16 h-16 border">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-lg">{fullName || 'Seu Nome'}</h3>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">URL do Avatar</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://exemplo.com/avatar.jpg"
              />
            </div>

            <div className="space-y-2 pt-4 border-t mt-4">
              <h4 className="font-medium text-sm">Privacidade e Segurança</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Configure uma Senha Mestre para proteger e desbloquear suas notas confidenciais.
              </p>
              <Label htmlFor="masterPassword">Senha Mestre (Notas Bloqueadas)</Label>
              <Input
                id="masterPassword"
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="Digite sua Senha Mestre"
              />
            </div>

            <div className="space-y-2 pt-4 border-t mt-4">
              <h4 className="font-medium text-sm">Alterar Senha de Acesso</h4>
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Deixe em branco para manter a atual"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[140px]">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
