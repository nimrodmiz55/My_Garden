import { useState } from 'react'
import LoginGate from './components/LoginGate'
import PlantForm from './components/PlantForm'
import PlantShelf from './components/PlantShelf'
import './App.css'

const STORAGE_KEY = 'garden_email'

function App() {
  const [email, setEmail]         = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [showForm, setShowForm]   = useState(false)
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
        <div className="app-header-text">
          <h1>My Garden</h1>
          <p>Track and care for your plants</p>
        </div>
        <div className="app-header-actions">
          <button
            className="btn-add"
            onClick={() => setShowForm((v) => !v)}
            aria-expanded={showForm}
          >
            {showForm ? '✕ Cancel' : '+ Add Plant'}
          </button>
          <div className="user-chip">
            <span className="user-email">{email}</span>
            <button className="btn-logout" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </header>

      {showForm && (
        <div className="form-panel">
          <PlantForm email={email} onSuccess={handlePlantAdded} />
        </div>
      )}

      <main className="app-main">
        <PlantShelf refresh={refreshKey} email={email} />
      </main>
    </div>
  )
}

export default App
