import { useState } from 'react'
import './LoginGate.css'

export default function LoginGate({ onLogin }) {
  const [email, setEmail]   = useState('')
  const [error, setError]   = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Please enter a valid email address.')
      return
    }
    onLogin(trimmed)
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
      </div>
    </div>
  )
}
