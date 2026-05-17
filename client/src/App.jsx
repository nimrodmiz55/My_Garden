import { useState } from 'react'
import PlantForm from './components/PlantForm'
import PlantShelf from './components/PlantShelf'
import './App.css'

function App() {
  const [showForm, setShowForm]   = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function handlePlantAdded() {
    setRefreshKey((k) => k + 1)
    setShowForm(false)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-text">
          <h1>My Garden</h1>
          <p>Track and care for your plants</p>
        </div>
        <button
          className="btn-add"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
        >
          {showForm ? '✕ Cancel' : '+ Add Plant'}
        </button>
      </header>

      {showForm && (
        <div className="form-panel">
          <PlantForm onSuccess={handlePlantAdded} />
        </div>
      )}

      <main className="app-main">
        <PlantShelf refresh={refreshKey} />
      </main>
    </div>
  )
}

export default App
