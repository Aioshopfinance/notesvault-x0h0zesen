import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import Scanner from '@/pages/Scanner'
import Secrets from '@/pages/Secrets'
import Audit from '@/pages/Audit'
import Timesheet from '@/pages/Timesheet'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'
import Auth from '@/pages/Auth'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/secrets" element={<Secrets />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/timesheet" element={<Timesheet />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
