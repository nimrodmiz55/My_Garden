import { useState } from 'react'
import './LoginGate.css'

export default function LoginGate({ onLogin, onDemoMode }) {
  const [email, setEmail]           = useState('')
  const [error, setError]           = useState('')
  const [demoLoading, setDemoLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Please enter a valid email address.')
      return
    }
    onLogin(trimmed)
  }

  async function handleDemoClick() {
    setDemoLoading(true)
    await onDemoMode()
  }

  return (
    <div className="login-gate">
      <div className="login-card">
        <div className="login-icon">🌿</div>
        <h1>My Garden</h1>
        <p>Enter your email to access your garden</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
            autoFocus
            required
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit">Enter My Garden</button>
        </form>

        <div className="login-divider"><span>or</span></div>

        <button
          className="btn-demo"
          onClick={handleDemoClick}
          disabled={demoLoading}
          type="button"
        >
          {demoLoading ? '🌱 Loading demo…' : "I'm just looking"}
        </button>
      </div>
    </div>
  )
}
