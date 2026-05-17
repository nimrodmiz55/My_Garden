import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState('Checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setApiStatus(data.message))
      .catch(() => setApiStatus('Could not reach server'))
  }, [])

  return (
    <div className="app">
      <h1>My Garden</h1>
      <p>Plant Care App</p>
      <p className="api-status">API: {apiStatus}</p>
    </div>
  )
}

export default App
