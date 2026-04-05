import { Shield, Moon, Sun, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) {
      toast({
        title: 'Sessão encerrada',
        description: 'Você saiu do NotesVault com sucesso.',
      })
      navigate('/auth')
    }
  }

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-background z-10 relative shadow-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden mr-2" />
        <div className="flex items-center gap-2 text-primary">
          <Shield className="w-5 h-5 fill-current" />
          <span className="font-bold text-lg hidden sm:inline-block tracking-tight">
            NotesVault
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
