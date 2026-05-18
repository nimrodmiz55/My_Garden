import { useState } from 'react'
import { LogOut, Camera, Plus } from 'lucide-react'
import LoginGate from './components/LoginGate'
import PlantForm from './components/PlantForm'
import PlantShelf from './components/PlantShelf'
import './App.css'

const STORAGE_KEY = 'garden_email'

function App() {
  const [email, setEmail]           = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [showForm, setShowForm]     = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleLogin(e) {
    localStorage.setItem(STORAGE_KEY, e)
    setEmail(e)
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY)
    setEmail('')
    setShowForm(false)
  }

  function handlePlantAdded() {
    setRefreshKey((k) => k + 1)
    setShowForm(false)
  }

  if (!email) return <LoginGate onLogin={handleLogin} />

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">My Garden</h1>
        <button className="btn-logout" onClick={handleLogout} aria-label="Log out">
          <LogOut size={18} />
        </button>
      </header>

      <main className="app-main">
        <PlantShelf refresh={refreshKey} email={email} />
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
            <PlantForm email={email} onSuccess={handlePlantAdded} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
