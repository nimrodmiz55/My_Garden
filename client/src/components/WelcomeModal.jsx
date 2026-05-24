import { useState } from 'react'
import './WelcomeModal.css'

export default function WelcomeModal({ onClose }) {
  const [tab, setTab] = useState('homescreen')

  return (
    <div className="welcome-backdrop" onClick={onClose}>
      <div className="welcome-card" onClick={(e) => e.stopPropagation()}>
        <button className="welcome-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="welcome-header">
          <span className="welcome-icon">🌱</span>
          <h2>Welcome to your garden!</h2>
          <p>A couple of quick tips to get started</p>
        </div>

        <div className="welcome-tabs">
          <button
            className={`welcome-tab${tab === 'homescreen' ? ' active' : ''}`}
            onClick={() => setTab('homescreen')}
            type="button"
          >
            📱 Add to Home Screen
          </button>
          <button
            className={`welcome-tab${tab === 'email' ? ' active' : ''}`}
            onClick={() => setTab('email')}
            type="button"
          >
            📧 Check Your Email
          </button>
        </div>

        {tab === 'homescreen' && (
          <div className="welcome-content">
            <p className="welcome-subtitle">Install the app for the best full-screen experience</p>
            <div className="welcome-guide">
              <div className="guide-item">
                <span className="guide-num">1</span>
                <div>
                  <strong>On iPhone / iPad (Safari)</strong>
                  <p>Tap the <span className="inline-tag">Share ⎦↑⎡</span> button at the bottom of Safari, then choose <em>Add to Home Screen</em>.</p>
                </div>
              </div>
              <div className="guide-item">
                <span className="guide-num">2</span>
                <div>
                  <strong>On Android (Chrome)</strong>
                  <p>Tap the <span className="inline-tag">⋮ Menu</span> in the top-right of Chrome, then tap <em>Add to Home Screen</em> or <em>Install App</em>.</p>
                </div>
              </div>
              <div className="guide-item">
                <span className="guide-num">3</span>
                <div>
                  <strong>Confirm &amp; enjoy!</strong>
                  <p>Tap <em>Add</em> when prompted. My Garden opens full-screen — no browser bar.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'email' && (
          <div className="welcome-content">
            <p className="welcome-subtitle">Make sure watering reminders reach your inbox</p>
            <div className="welcome-guide">
              <div className="guide-item">
                <span className="guide-num">1</span>
                <div>
                  <strong>Check your spam folder</strong>
                  <p>Reminders come from <em>noreply@my-garden-bot.online</em>. Your provider may flag them as spam at first.</p>
                </div>
              </div>
              <div className="guide-item">
                <span className="guide-num">2</span>
                <div>
                  <strong>Mark as "Not Spam"</strong>
                  <p>If you find our email in spam, open it and click <em>Not Spam</em> or <em>Mark as safe</em> to move it to your inbox.</p>
                </div>
              </div>
              <div className="guide-item">
                <span className="guide-num">3</span>
                <div>
                  <strong>Add us to contacts</strong>
                  <p>Saving <em>noreply@my-garden-bot.online</em> as a contact guarantees our emails always land safely.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <button className="welcome-cta" onClick={onClose} type="button">
          Got it, let&apos;s grow! 🌿
        </button>
      </div>
    </div>
  )
}
