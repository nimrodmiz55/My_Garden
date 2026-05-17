import { useEffect, useState } from 'react'
import PlantModal from './PlantModal'
import './PlantShelf.css'

// Each plant breathes at a slightly different pace so they never all peak together
const DURATIONS = [3.4, 4.0, 3.7, 4.4, 3.2, 4.8]
const DELAYS    = [0,   0.6, 1.3, 0.9, 2.0, 1.6]

function PlantIcon({ plant, index }) {
  const animStyle = {
    animationDuration: `${DURATIONS[index % DURATIONS.length]}s`,
    animationDelay:    `${DELAYS[index % DELAYS.length]}s`,
  }

  if (plant.image_url) {
    return (
      <img
        src={plant.image_url}
        alt={plant.nickname}
        className="plant-img"
        style={animStyle}
      />
    )
  }

  // Fallback for any plants saved before Storage was wired up
  return (
    <div className="plant-img plant-img-fallback" style={animStyle} aria-hidden="true">
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
          {plants.map((plant, i) => (
            <button
              key={plant.id}
              className="plant-card"
              onClick={() => setSelected(plant)}
              aria-label={`View details for ${plant.nickname}`}
            >
              <PlantIcon plant={plant} index={i} />
              <span className="plant-nickname">{plant.nickname}</span>
            </button>
          ))}
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
        />
      )}
    </>
  )
}
