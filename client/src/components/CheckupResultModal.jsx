import { useEffect } from 'react'
import './CheckupResultModal.css'

// Build the headline + scenario sentence for each checkup status.
function describe(result, nickname) {
  const { status, wateringIntervalDays, pauseWateringDays } = result

  switch (status) {
    case 'great':
      return {
        variant: 'great',
        title: '🌿 Looking Great',
        line: `${nickname} is in amazing condition — keep it up!`,
      }
    case 'grew':
      return {
        variant: 'attention',
        title: '⚠️ Attention',
        line: `${nickname} is doing well and has grown! Its size and watering schedule are now updated.`,
      }
    case 'underwatered':
      return {
        variant: 'attention',
        title: '⚠️ Attention',
        line: `${nickname} needs more frequent watering — already updated to a better schedule in your garden.`,
      }
    case 'overwatered':
      return {
        variant: 'attention',
        title: '⚠️ Attention',
        line: `${nickname} was overwatered. Hold off watering for ${pauseWateringDays} day${pauseWateringDays !== 1 ? 's' : ''} — you'll get reminders as usual afterwards (every ${wateringIntervalDays} day${wateringIntervalDays !== 1 ? 's' : ''}).`,
      }
    default:
      return { variant: 'attention', title: '⚠️ Attention', line: '' }
  }
}

export default function CheckupResultModal({ result, nickname, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const { variant, title, line } = describe(result, nickname)

  return (
    <div className="checkup-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`checkup-card checkup-card--${variant}`} onClick={(e) => e.stopPropagation()}>
        <button className="checkup-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="checkup-title">{title}</h2>
        <p className="checkup-line">{line}</p>

        {result.message && <p className="checkup-message">{result.message}</p>}

        {result.homeRemedy && (
          <p className="checkup-remedy">
            💡 Grandma's remedy — we recommend you try: {result.homeRemedy}
          </p>
        )}

        <button className="checkup-ok" onClick={onClose} type="button">Got it</button>
      </div>
    </div>
  )
}
