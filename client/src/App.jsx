import { useEffect, useState } from 'react'
import { LogOut, Camera, Plus, Settings } from 'lucide-react'
import LoginGate from './components/LoginGate'
import PlantForm from './components/PlantForm'
import PlantShelf from './components/PlantShelf'
import WelcomeModal from './components/WelcomeModal'
import SettingsModal from './components/SettingsModal'
import { API_BASE } from './lib/api'
import './App.css'

const STORAGE_KEY  = 'garden_email'
const DEMO_EMAIL   = 'nimi98791@gmail.com'

function App() {
  const [email, setEmail]               = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [showForm, setShowForm]         = useState(false)
  const [refreshKey, setRefreshKey]     = useState(0)
  const [isDemo, setIsDemo]             = useState(false)
  const [demoPlants, setDemoPlants]     = useState(null)
  const [demoNewPlant, setDemoNewPlant] = useState(null)
  const [showWelcome, setShowWelcome]   = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  // Capture the browser's native install prompt so we can trigger it on demand
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function handleLogin(e) {
    localStorage.setItem(STORAGE_KEY, e)
    setEmail(e)
    const key = `garden_welcomed_${e}`
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      setShowWelcome(true)
      fetch(`${API_BASE}/api/users/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e }),
      }).catch(() => {})
    }
  }

  async function handleDemoMode() {
    let plants = []
    try {
      const res = await fetch(`${API_BASE}/api/plants?email=${encodeURIComponent(DEMO_EMAIL)}`)
      if (res.ok) plants = await res.json()
    } catch {}
    setDemoPlants(plants)
    setIsDemo(true)
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY)
    setEmail('')
    setShowForm(false)
    setIsDemo(false)
    setDemoPlants(null)
    setDemoNewPlant(null)
  }

  function handlePlantAdded(data) {
    if (isDemo && data) {
      setDemoNewPlant(data)
    } else {
      setRefreshKey((k) => k + 1)
    }
    setShowForm(false)
  }

  if (!email && !isDemo) return (
    <LoginGate onLogin={handleLogin} onDemoMode={handleDemoMode} />
  )

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button
            className="btn-settings"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
          {isDemo && <span className="demo-badge">Demo</span>}
        </div>

        <h1 className="app-title">My Garden</h1>

        <button className="btn-logout" onClick={handleLogout} aria-label="Log out">
          <LogOut size={18} />
        </button>
      </header>

      <main className="app-main">
        <PlantShelf
          refresh={refreshKey}
          email={email}
          isDemo={isDemo}
          demoPlants={demoPlants}
          demoNewPlant={demoNewPlant}
        />
      </main>

      <button
        className={`fab${showForm ? ' fab--open' : ''}`}
        onClick={() => setShowForm((v) => !v)}
        aria-label={showForm ? 'Cancel' : 'Add plant'}
      >
        {showForm ? (
          <span className="fab-cancel">✕</span>
        ) : (
          <span className="fab-icon-wrap">
            <Camera size={22} strokeWidth={2} />
            <span className="fab-plus-badge">
              <Plus size={10} strokeWidth={3.5} />
            </span>
          </span>
        )}
      </button>

      {showForm && (
        <div className="form-overlay" onClick={() => setShowForm(false)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <PlantForm email={email} onSuccess={handlePlantAdded} isDemo={isDemo} />
          </div>
        </div>
      )}

      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          deferredPrompt={deferredPrompt}
          onPromptUsed={() => setDeferredPrompt(null)}
        />
      )}
    </div>
  )
}

export default App
