import { useState, useEffect, createContext, useContext, lazy, Suspense, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { usePreferences } from './hooks/usePreferences'
import Landing from './pages/Landing'
import AppLayout from './components/AppLayout'
import DesktopOnly from './components/DesktopOnly'
import './styles/auth.css'

// Lazy load pages for performance — only loaded when navigated to
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Products = lazy(() => import('./pages/Products'))
const Orders = lazy(() => import('./pages/Orders'))
const Customers = lazy(() => import('./pages/Customers'))
const DemoViewer = lazy(() => import('./pages/DemoViewer'))
const SmartQuote = lazy(() => import('./pages/SmartQuote'))
const MeasureAssistant = lazy(() => import('./pages/MeasureAssistant'))
const Moodboard = lazy(() => import('./pages/Moodboard'))
const Analytics = lazy(() => import('./pages/Analytics'))
const InventoryOracle = lazy(() => import('./pages/InventoryOracle'))
const WhiteLabel = lazy(() => import('./pages/WhiteLabel'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Settings = lazy(() => import('./pages/Settings'))

export const ThemeContext = createContext()

export function useTheme() {
  return useContext(ThemeContext)
}

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '50vh', color: 'var(--text-secondary)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px', animation: 'spin 1.5s linear infinite' }}>⚙️</div>
        <div style={{ fontSize: '0.9rem' }}>Yükleniyor...</div>
      </div>
    </div>
  )
}

/**
 * ProtectedRoute — Redirects to /login if not authenticated.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

/**
 * GuestRoute — Redirects to /dashboard if already authenticated.
 */
function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <PageLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/demo" element={<DesktopOnly><DemoViewer /></DesktopOnly>} />
          <Route path="/quote" element={<SmartQuote />} />
          <Route path="/measure" element={<DesktopOnly><MeasureAssistant /></DesktopOnly>} />
          <Route path="/moodboard" element={<DesktopOnly><Moodboard /></DesktopOnly>} />
          <Route path="/analytics" element={<DesktopOnly><Analytics /></DesktopOnly>} />
          <Route path="/inventory-oracle" element={<DesktopOnly><InventoryOracle /></DesktopOnly>} />
          <Route path="/white-label" element={<DesktopOnly><WhiteLabel /></DesktopOnly>} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

/**
 * ThemeSyncProvider — syncs theme from DB (when logged in) with localStorage fallback.
 * Must be inside ClerkProvider + AuthProvider to access usePreferences.
 */
function ThemeSyncProvider({ theme, setThemeFn, children }) {
  const { isAuthenticated } = useAuth()
  const { prefs, setTheme: saveTheme } = usePreferences()

  // Sync from DB when prefs load
  useEffect(() => {
    if (isAuthenticated && prefs?.theme && prefs.theme !== theme) {
      setThemeFn(prefs.theme)
      document.documentElement.className = prefs.theme
      localStorage.setItem('perdemo-theme', prefs.theme)
    }
  }, [prefs?.theme, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setThemeFn(next)
    document.documentElement.className = next
    localStorage.setItem('perdemo-theme', next)
    // Save to DB if authenticated
    if (isAuthenticated) {
      saveTheme(next)
    }
  }, [theme, setThemeFn, isAuthenticated, saveTheme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function App() {
  // Initialize from localStorage for instant render (no flash)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('perdemo-theme') || 'dark'
  })

  // Set HTML class on mount
  useEffect(() => {
    document.documentElement.className = theme
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <AuthProvider>
        <ThemeSyncProvider theme={theme} setThemeFn={setTheme}>
          <AppRoutes />
        </ThemeSyncProvider>
      </AuthProvider>
    </ClerkProvider>
  )
}

export default App
