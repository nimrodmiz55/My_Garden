import { useRegisterSW } from 'virtual:pwa-register/react'
import './UpdateToast.css'

export default function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="update-toast" role="status" aria-live="polite">
      <span className="update-toast-msg">🌿 A new update is available</span>
      <div className="update-toast-btns">
        <button className="update-later" onClick={() => setNeedRefresh(false)}>
          Later
        </button>
        <button className="update-refresh" onClick={() => updateServiceWorker(true)}>
          Refresh
        </button>
      </div>
    </div>
  )
}
