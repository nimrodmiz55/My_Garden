import { useEffect, useState } from 'react'
import PlantModal from './PlantModal'
import './PlantShelf.css'

// Leaf-cluster colors cycling per card
const LEAF_COLORS = ['#52b788', '#40916c', '#74c69d', '#2d6a4f', '#95d5b2', '#1b4332']

function PlantSvg({ colorIdx }) {
  const leaf = LEAF_COLORS[colorIdx % LEAF_COLORS.length]
  const leafDark = LEAF_COLORS[(colorIdx + 1) % LEAF_COLORS.length]
  return (
    <svg width="64" height="84" viewBox="0 0 64 84" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* leaf crown */}
      <ellipse cx="32" cy="18" rx="16" ry="14" fill={leaf} />
      <ellipse cx="16" cy="27" rx="11" ry="9"  fill={leafDark} />
      <ellipse cx="48" cy="27" rx="11" ry="9"  fill={leafDark} />
      {/* stem */}
      <rect x="29" y="30" width="6" height="13" rx="3" fill="#74c69d" />
      {/* pot rim */}
      <rect x="15" y="41" width="34" height="6" rx="3" fill="#c2773b" />
      {/* pot body */}
      <path d="M19 47 L45 47 L41 76 L23 76 Z" fill="#a05c2c" />
      {/* pot highlight */}
      <path d="M25 50 L23 72" stroke="#c2773b" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
    </svg>
  )
}

export default function PlantShelf({ refresh }) {
  const [plants, setPlants]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
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
              <PlantSvg colorIdx={i} />
              <span className="plant-nickname">{plant.nickname}</span>
            </button>
          ))}
        </div>
        <div className="shelf-plank" aria-hidden="true" />
      </section>

      {selected && (
        <PlantModal plant={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
