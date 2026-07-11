import { useEffect, useState } from 'react'
import PlantModal from './PlantModal'
import { API_BASE } from '../lib/api'
import './PlantShelf.css'

const DURATIONS = [3.4, 4.0, 3.7, 4.4, 3.2, 4.8]
const DELAYS    = [0,   0.6, 1.3, 0.9, 2.0, 1.6]

function isThirsty(plant) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // A plant under an active watering pause (after an over-watering checkup) isn't thirsty yet.
  if (plant.water_pause_until) {
    const [py, pm, pd] = plant.water_pause_until.split('-').map(Number)
    if (today < new Date(py, pm - 1, pd)) return false
  }

  const [y, m, d] = plant.last_watered_date.split('-').map(Number)
  const nextWatering = new Date(y, m - 1, d)
  nextWatering.setDate(nextWatering.getDate() + plant.watering_interval_days)
  return today >= nextWatering
}

function PlantIcon({ plant, index, thirsty }) {
  const baseDuration = DURATIONS[index % DURATIONS.length]
  const animStyle = {
    animationDuration: `${thirsty ? baseDuration / 2 : baseDuration}s`,
    animationDelay:    `${DELAYS[index % DELAYS.length]}s`,
  }

  const imgClass = ['plant-img', thirsty ? 'plant-img--thirsty' : ''].join(' ').trim()

  if (plant.image_url) {
    return (
      <img
        src={plant.image_url}
        alt={plant.nickname}
        className={imgClass}
        style={animStyle}
      />
    )
  }

  return (
    <div className={`${imgClass} plant-img-fallback`} style={animStyle} aria-hidden="true">
      🪴
    </div>
  )
}

export default function PlantShelf({ refresh, email, isDemo, demoPlants, demoNewPlant }) {
  const [plants, setPlants]     = useState([])
  const [loading, setLoading]   = useState(!isDemo)
  const [error, setError]       = useState(null)
  const [selected, setSelected] = useState(null)

  // Initialize from demo plants when demo mode activates
  useEffect(() => {
    if (!isDemo) return
    setPlants(demoPlants || [])
    setLoading(false)
    setError(null)
  }, [isDemo, demoPlants])

  // Prepend a newly added demo plant
  useEffect(() => {
    if (demoNewPlant) {
      setPlants((prev) => [demoNewPlant, ...prev])
    }
  }, [demoNewPlant])

  // Normal data fetch — skipped in demo mode
  useEffect(() => {
    if (isDemo) return
    setLoading(true)
    fetch(`${API_BASE}/api/plants?email=${encodeURIComponent(email)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Could not load plants')
        return r.json()
      })
      .then(setPlants)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [refresh, email, isDemo])

  if (loading) return <p className="shelf-message">Loading your garden…</p>
  if (error)   return <p className="shelf-message error">{error}</p>
  if (!plants.length) {
    return (
      <p className="shelf-message">
        {isDemo
          ? 'The demo garden is empty — tap the button below to add a plant!'
          : 'Your shelf is empty — tap the button below to add your first plant!'}
      </p>
    )
  }

  // Chunk plants into rows of max 3 so each row gets its own shelf plank
  const rows = []
  for (let i = 0; i < plants.length; i += 3) {
    rows.push(plants.slice(i, i + 3))
  }

  return (
    <>
      <section className="shelf-section" aria-label="Plant shelf">
        {rows.map((rowPlants, rowIdx) => (
          <div key={rowIdx} className="shelf-row-wrapper">
            <div className="shelf-items">
              {rowPlants.map((plant, i) => {
                const thirsty   = isThirsty(plant)
                const globalIdx = rowIdx * 3 + i
                return (
                  <button
                    key={plant.id}
                    className="plant-card"
                    onClick={() => setSelected(plant)}
                    aria-label={`View details for ${plant.nickname}`}
                  >
                    <PlantIcon plant={plant} index={globalIdx} thirsty={thirsty} />
                    <span className={`plant-nickname${thirsty ? ' plant-nickname--thirsty' : ''}`}>
                      {plant.nickname}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="shelf-plank" aria-hidden="true" />
          </div>
        ))}
      </section>

      {selected && (
        <PlantModal
          plant={selected}
          isDemo={isDemo}
          onClose={() => setSelected(null)}
          onDelete={(id) => {
            setPlants((prev) => prev.filter((p) => p.id !== id))
            setSelected(null)
          }}
          onWater={(id, newDate) => {
            setPlants((prev) =>
              prev.map((p) => p.id === id ? { ...p, last_watered_date: newDate } : p)
            )
            setSelected(null)
          }}
          onRename={(id, newName) => {
            setPlants((prev) =>
              prev.map((p) => p.id === id ? { ...p, nickname: newName } : p)
            )
            setSelected((prev) => prev ? { ...prev, nickname: newName } : null)
          }}
          onCheckup={(id, updated) => {
            // Merge the checkup-updated fields; keep the modal open to show the result.
            const patch = {
              size: updated.size,
              watering_interval_days: updated.watering_interval_days,
              water_pause_until: updated.water_pause_until,
            }
            setPlants((prev) =>
              prev.map((p) => p.id === id ? { ...p, ...patch } : p)
            )
            setSelected((prev) => prev ? { ...prev, ...patch } : null)
          }}
        />
      )}
    </>
  )
}
