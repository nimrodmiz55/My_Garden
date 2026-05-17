import { useEffect, useState } from 'react'
import PlantModal from './PlantModal'
import './PlantShelf.css'

// Each plant breathes at a slightly different pace so they never all peak together
const DURATIONS = [3.4, 4.0, 3.7, 4.4, 3.2, 4.8]
const DELAYS    = [0,   0.6, 1.3, 0.9, 2.0, 1.6]

function isThirsty(plant) {
  const [y, m, d] = plant.last_watered_date.split('-').map(Number)
  const nextWatering = new Date(y, m - 1, d)
  nextWatering.setDate(nextWatering.getDate() + plant.watering_interval_days)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today >= nextWatering
}

function PlantIcon({ plant, index, thirsty }) {
  const baseDuration = DURATIONS[index % DURATIONS.length]
  const animStyle = {
    // Thirsty plants animate at ~half the normal speed — more urgent
    animationDuration: `${thirsty ? baseDuration / 2 : baseDuration}s`,
    animationDelay:    `${DELAYS[index % DELAYS.length]}s`,
  }

  const imgClass = [
    'plant-img',
    thirsty ? 'plant-img--thirsty' : '',
  ].join(' ').trim()

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

  // Fallback for any plants saved before Storage was wired up
  return (
    <div className={`${imgClass} plant-img-fallback`} style={animStyle} aria-hidden="true">
      🪴
    </div>
  )
}

export default function PlantShelf({ refresh }) {
  const [plants, setPlants]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/plants')
      .then((r) => {
        if (!r.ok) throw new Error('Could not load plants')
        return r.json()
      })
      .then(setPlants)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [refresh])

  if (loading) return <p className="shelf-message">Loading your garden…</p>
  if (error)   return <p className="shelf-message error">{error}</p>
  if (!plants.length) {
    return <p className="shelf-message">Your shelf is empty — add your first plant!</p>
  }

  return (
    <>
      <section className="shelf-section" aria-label="Plant shelf">
        <div className="shelf-row">
          {plants.map((plant, i) => {
            const thirsty = isThirsty(plant)
            return (
              <button
                key={plant.id}
                className="plant-card"
                onClick={() => setSelected(plant)}
                aria-label={`View details for ${plant.nickname}`}
              >
                <PlantIcon plant={plant} index={i} thirsty={thirsty} />
                <span className={`plant-nickname${thirsty ? ' plant-nickname--thirsty' : ''}`}>
                  {plant.nickname}
                </span>
              </button>
            )
          })}
        </div>
        <div className="shelf-plank" aria-hidden="true" />
      </section>

      {selected && (
        <PlantModal
          plant={selected}
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
        />
      )}
    </>
  )
}
