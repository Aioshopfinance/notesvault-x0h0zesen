import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, User, Shield, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'profile' | 'security' | 'master-password'

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  return (
    <div className="container max-w-5xl py-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-col space-y-1">
            <TabButton
              icon={<User className="w-4 h-4 mr-2" />}
              label="Perfil da Conta"
              active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
            />
            <TabButton
              icon={<Shield className="w-4 h-4 mr-2" />}
              label="Privacidade e Segurança"
              active={activeTab === 'security'}
              onClick={() => setActiveTab('security')}
            />
            <TabButton
              icon={<KeyRound className="w-4 h-4 mr-2" />}
              label="Senha Mestre"
              active={activeTab === 'master-password'}
              onClick={() => setActiveTab('master-password')}
            />
          </nav>
        </aside>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <ProfileForm user={user} profile={profile} refreshProfile={refreshProfile} />
          )}
          {activeTab === 'security' && <SecurityForm user={user} />}
          {activeTab === 'master-password' && <MasterPasswordForm user={user} />}
        </div>
      </div>
    </div>
  )
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors text-left',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function ProfileForm({ user, profile, refreshProfile }: any) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    avatarUrl: '',
    secondaryEmail: '',
    phone: '',
    address: '',
    country: '',
    state: '',
    city: '',
    zipCode: '',
    currency: 'USD',
  })

  useEffect(() => {
    if (user) {
      const fetchPrefs = async () => {
        const { data } = await (supabase as any)
          .from('user_preferences')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          setFormData({
            fullName: data.full_name || '',
            avatarUrl: data.avatar_url || '',
            secondaryEmail: data.secondary_email || '',
            phone: data.phone || '',
            address: data.address || '',
            country: data.country || '',
            state: data.state || '',
            city: data.city || '',
            zipCode: data.zip_code || '',
            currency: data.currency || 'USD',
          })
        }
      }

      fetchPrefs()
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .update({
          full_name: formData.fullName,
          avatar_url: formData.avatarUrl,
          secondary_email: formData.secondaryEmail,
          phone: formData.phone,
          address: formData.address,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          zip_code: formData.zipCode,
          currency: formData.currency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      if (refreshProfile) await refreshProfile()
      toast({ title: 'Perfil atualizado com sucesso!' })
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar perfil',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const initials = (formData.fullName || user?.email || 'US').substring(0, 2).toUpperCase()

  return (
    <Card className="h-full flex flex-col max-h-[calc(100vh-8rem)]">
      <CardHeader>
        <CardTitle>Perfil da Conta</CardTitle>
        <CardDescription>Atualize suas informações pessoais e de contato.</CardDescription>
      </CardHeader>

      <CardContent className="overflow-y-auto pb-20 flex-1">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="w-16 h-16 border">
            <AvatarImage src={formData.avatarUrl} alt={formData.fullName} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>

          <div>
            <h3 className="font-medium text-lg">{formData.fullName || 'Seu Nome'}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input id="fullName" value={formData.fullName} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">URL do Avatar</Label>
              <Input
                id="avatarUrl"
                value={formData.avatarUrl}
                onChange={handleChange}
                placeholder="https://exemplo.com/avatar.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryEmail">E-mail Principal</Label>
              <Input id="primaryEmail" value={user?.email || ''} disabled readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryEmail">E-mail Secundário</Label>
              <Input
                id="secondaryEmail"
                type="email"
                value={formData.secondaryEmail}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input id="zipCode" value={formData.zipCode} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moeda Padrão</Label>
              <Select
                value={formData.currency}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, currency: v }))}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD (Dólares)</SelectItem>
                  <SelectItem value="BRL">BRL (Reais)</SelectItem>
                  <SelectItem value="EUR">EUR (Euros)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" value={formData.address} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" value={formData.city} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input id="state" value={formData.state} onChange={handleChange} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="country">País</Label>
              <Input id="country" value={formData.country} onChange={handleChange} />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function SecurityForm({ user }: { user: any }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      return toast({ title: 'A senha atual é obrigatória', variant: 'destructive' })
    }

    if (password !== confirmPassword) {
      return toast({ title: 'As novas senhas não coincidem', variant: 'destructive' })
    }

    if (password.length < 6) {
      return toast({ title: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' })
    }

    setLoading(true)

    try {
      if (user?.email) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        })

        if (verifyError) throw new Error('Senha atual incorreta')
      }

      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')
      toast({ title: 'Senha atualizada com sucesso!' })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar senha',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacidade e Segurança</CardTitle>
        <CardDescription>Gerencie sua senha de acesso ao aplicativo.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function MasterPasswordForm({ user }: { user: any }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentMasterPassword, setCurrentMasterPassword] = useState('')
  const [hasMasterPassword, setHasMasterPassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (user) {
      const fetchPwd = async () => {
        const { data } = await (supabase as any)
          .from('user_preferences')
          .select('master_password')
          .eq('id', user.id)
          .single()

        if (data?.master_password) {
          setHasMasterPassword(true)
          setCurrentMasterPassword(data.master_password)
        }
      }

      fetchPwd()
    }
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasMasterPassword && oldPassword !== currentMasterPassword) {
      return toast({ title: 'Senha antiga incorreta', variant: 'destructive' })
    }

    if (newPassword !== confirmPassword) {
      return toast({ title: 'As novas senhas não coincidem', variant: 'destructive' })
    }

    if (!newPassword) {
      return toast({
        title: 'A nova senha mestre não pode estar vazia',
        variant: 'destructive',
      })
    }

    setLoading(true)

    try {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .update({
          master_password: newPassword,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setCurrentMasterPassword(newPassword)
      setHasMasterPassword(true)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')

      toast({ title: 'Senha mestre atualizada com sucesso!' })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar senha mestre',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Senha Mestre (Notas Bloqueadas)</CardTitle>
        <CardDescription>
          Configure ou altere sua senha mestre usada para proteger anotações confidenciais.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          {hasMasterPassword && (
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Senha Antiga</Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha Mestre</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha Mestre</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
