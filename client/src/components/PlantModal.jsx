import { useEffect, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
import { API_BASE } from '../lib/api'
import './PlantModal.css'

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmt(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PlantModal({ plant, onClose, onDelete, onWater, onRename, isDemo }) {
  const [confirming,   setConfirming]   = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [deleteError,  setDeleteError]  = useState(null)
  const [watering,     setWatering]     = useState(false)
  const [waterError,   setWaterError]   = useState(null)

  const [isEditing,    setIsEditing]    = useState(false)
  const [editName,     setEditName]     = useState(plant.nickname)
  const [renaming,     setRenaming]     = useState(false)
  const [renameError,  setRenameError]  = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  function startEditing() {
    setEditName(plant.nickname)
    setRenameError(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setRenameError(null)
  }

  async function handleRename() {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === plant.nickname) {
      setIsEditing(false)
      return
    }

    if (isDemo) {
      onRename(plant.id, trimmed)
      setIsEditing(false)
      return
    }

    setRenaming(true)
    setRenameError(null)
    try {
      const res = await fetch(`${API_BASE}/api/plants/${plant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Rename failed')
      onRename(plant.id, data.nickname)
      setIsEditing(false)
    } catch (err) {
      setRenameError(err.message)
    } finally {
      setRenaming(false)
    }
  }

  async function handleWater() {
    if (isDemo) {
      onWater(plant.id, new Date().toISOString().split('T')[0])
      return
    }
    setWatering(true)
    setWaterError(null)
    try {
      const res = await fetch(`${API_BASE}/api/plants/${plant.id}/water`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      onWater(plant.id, data.last_watered_date)
    } catch (err) {
      setWaterError(err.message)
      setWatering(false)
    }
  }

  async function handleDelete() {
    if (isDemo) {
      onDelete(plant.id)
      return
    }
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`${API_BASE}/api/plants/${plant.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Delete failed')
      }
      onDelete(plant.id)
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
      setConfirming(false)
    }
  }

  const nextWatering = addDays(plant.last_watered_date, plant.watering_interval_days)

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={plant.nickname}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {isEditing ? (
          <div className="modal-title-edit">
            <input
              ref={inputRef}
              className="modal-title-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') cancelEditing()
              }}
              maxLength={60}
              aria-label="Plant name"
            />
            <div className="modal-title-edit-actions">
              <button className="btn-rename-cancel" onClick={cancelEditing} disabled={renaming}>Cancel</button>
              <button className="btn-rename-save" onClick={handleRename} disabled={renaming || !editName.trim()}>
                {renaming ? 'Saving…' : 'Save'}
              </button>
            </div>
            {renameError && <p className="rename-error">{renameError}</p>}
          </div>
        ) : (
          <div className="modal-title-row">
            <h2 className="modal-title">{plant.nickname}</h2>
            <button className="btn-rename-trigger" onClick={startEditing} aria-label="Rename plant">
              <Pencil size={15} />
            </button>
          </div>
        )}

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

        <div className="modal-footer">
          {(deleteError || waterError) && (
            <p className="footer-error">{deleteError || waterError}</p>
          )}

          {!confirming ? (
            <div className="footer-actions">
              <button
                className="btn-water"
                onClick={handleWater}
                disabled={watering || deleting}
              >
                {watering ? 'Updating…' : '💧 Just Watered'}
              </button>
              <button
                className="btn-delete"
                onClick={() => setConfirming(true)}
                disabled={watering}
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="delete-confirm">
              <span>Remove &ldquo;{plant.nickname}&rdquo;?</span>
              <div className="delete-confirm-actions">
                <button
                  className="btn-cancel-delete"
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn-confirm-delete"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
