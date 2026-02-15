import { useState, createContext, useContext, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import AppLayout from './components/AppLayout'

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

function App() {
  const [theme, setTheme] = useState('dark')

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.className = next
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/demo" element={<DemoViewer />} />
            <Route path="/quote" element={<SmartQuote />} />
            <Route path="/measure" element={<MeasureAssistant />} />
            <Route path="/moodboard" element={<Moodboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/inventory-oracle" element={<InventoryOracle />} />
            <Route path="/white-label" element={<WhiteLabel />} />
          </Route>
        </Routes>
      </Suspense>
    </ThemeContext.Provider>
  )
}

export default App
