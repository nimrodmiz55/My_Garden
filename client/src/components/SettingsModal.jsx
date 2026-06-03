import { useEffect, useState } from 'react'
import './SettingsModal.css'

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export default function SettingsModal({ onClose, deferredPrompt, onPromptUsed }) {
  const [installed, setInstalled]   = useState(isStandalone)
  const [showGuide, setShowGuide]   = useState(false)
  const [installing, setInstalling] = useState(false)

  const ios              = isIOSDevice()
  const canNativeInstall = Boolean(deferredPrompt) && !installed

  // Listen for the app becoming installed mid-session
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    const handler = () => setInstalled(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleInstall() {
    if (canNativeInstall) {
      setInstalling(true)
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      onPromptUsed()
      setInstalling(false)
      if (outcome === 'accepted') onClose()
    } else {
      setShowGuide(true)
    }
  }

  const btnLabel = installed
    ? 'Already Installed'
    : installing
      ? 'Opening installer…'
      : canNativeInstall
        ? 'Install App'
        : 'How to Install'

  return (
    <div className="settings-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Settings">
      <div className="settings-card" onClick={(e) => e.stopPropagation()}>
        <button className="settings-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="settings-header">
          <span className="settings-icon">⚙️</span>
          <h2>Settings</h2>
        </div>

        <div className="settings-section">
          <p className="settings-section-label">App</p>

          {!showGuide ? (
            <button
              className={`settings-install-btn${installed ? ' is-installed' : ''}`}
              onClick={installed ? undefined : handleInstall}
              disabled={installed || installing}
            >
              <span className="sib-icon">{installed ? '✓' : '⬇'}</span>
              <div className="sib-body">
                <span className="sib-title">{btnLabel}</span>
                {!installed && (
                  <span className="sib-sub">
                    {canNativeInstall
                      ? 'Adds My Garden to your home screen'
                      : 'Step-by-step install guide'}
                  </span>
                )}
              </div>
            </button>
          ) : (
            <div className="install-guide">
              <p className="install-guide-heading">
                {ios ? 'Install on iPhone / iPad' : 'Install on Android / Desktop'}
              </p>

              {ios ? (
                <>
                  <div className="ig-step">
                    <span className="ig-num">1</span>
                    <div>
                      <strong>Tap the Share button</strong>
                      <p>Tap <span className="inline-tag">Share ⎦↑⎡</span> at the bottom of Safari.</p>
                    </div>
                  </div>
                  <div className="ig-step">
                    <span className="ig-num">2</span>
                    <div>
                      <strong>Add to Home Screen</strong>
                      <p>Scroll down and tap <em>Add to Home Screen</em>.</p>
                    </div>
                  </div>
                  <div className="ig-step">
                    <span className="ig-num">3</span>
                    <div>
                      <strong>Confirm</strong>
                      <p>Tap <em>Add</em> — My Garden will open full-screen, no browser bar.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="ig-step">
                    <span className="ig-num">1</span>
                    <div>
                      <strong>Open the browser menu</strong>
                      <p>Tap <span className="inline-tag">⋮ Menu</span> in Chrome or Edge.</p>
                    </div>
                  </div>
                  <div className="ig-step">
                    <span className="ig-num">2</span>
                    <div>
                      <strong>Tap Install App</strong>
                      <p>Choose <em>Add to Home Screen</em> or <em>Install App</em>.</p>
                    </div>
                  </div>
                  <div className="ig-step">
                    <span className="ig-num">3</span>
                    <div>
                      <strong>Confirm</strong>
                      <p>Tap <em>Install</em> — My Garden launches full-screen from your home screen.</p>
                    </div>
                  </div>
                </>
              )}

              <button className="ig-back" onClick={() => setShowGuide(false)}>← Back</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
