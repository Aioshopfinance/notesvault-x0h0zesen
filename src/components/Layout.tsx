import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Header } from '@/components/Header'
import { ThemeProvider } from '@/components/theme-provider'

export default function Layout() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="notesvault-theme">
      <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
        <SidebarProvider className="flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 overflow-hidden w-full">
            <Header />
            <main className="flex-1 overflow-hidden flex flex-col relative w-full">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </ThemeProvider>
  )
}
