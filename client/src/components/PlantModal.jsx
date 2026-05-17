import { useEffect } from 'react'
import './PlantModal.css'

function addDays(dateStr, days) {
  // Parse as local date to avoid timezone shifting
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmt(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PlantModal({ plant, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const nextWatering = addDays(plant.last_watered_date, plant.watering_interval_days)

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={plant.nickname}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="modal-title">{plant.nickname}</h2>
        <p className="modal-species">{plant.species}</p>

        <dl className="modal-details">
          <div className="modal-row">
            <dt>Size</dt>
            <dd className={`size-badge size-${plant.size}`}>{plant.size}</dd>
          </div>
          <div className="modal-row">
            <dt>Last watered</dt>
            <dd>{fmt(plant.last_watered_date)}</dd>
          </div>
          <div className="modal-row">
            <dt>Watering every</dt>
            <dd>{plant.watering_interval_days} day{plant.watering_interval_days !== 1 ? 's' : ''}</dd>
          </div>
          <div className="modal-row highlight">
            <dt>Next watering</dt>
            <dd>{nextWatering}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
