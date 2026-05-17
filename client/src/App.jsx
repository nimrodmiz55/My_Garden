import PlantForm from './components/PlantForm'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>My Garden</h1>
        <p>Track and care for your plants</p>
      </header>
      <main className="app-main">
        <PlantForm />
      </main>
    </div>
  )
}

export default App
