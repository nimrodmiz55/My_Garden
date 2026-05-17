import { useRef, useState } from 'react'
import './PlantForm.css'

export default function PlantForm({ onSuccess }) {
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [nickname, setNickname] = useState('')
  const [lastWatered, setLastWatered] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!photo) {
      setStatus({ ok: false, message: 'Please select a photo of your plant.' })
      return
    }

    const formData = new FormData()
    formData.append('photo', photo)
    formData.append('nickname', nickname)
    formData.append('lastWatered', lastWatered)

    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch('/api/plants', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setStatus({ ok: true, message: `"${data.nickname}" added to your garden!` })
      setTimeout(() => onSuccess?.(data), 1200)
    } catch (err) {
      setStatus({ ok: false, message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="plant-form" onSubmit={handleSubmit}>
      <h2>Add a Plant</h2>

      <div
        className="photo-drop"
        onClick={() => inputRef.current.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current.click()}
      >
        {preview ? (
          <img src={preview} alt="Plant preview" className="photo-preview" />
        ) : (
          <span className="photo-placeholder">Tap to take or upload a photo</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          hidden
        />
      </div>

      <label>
        Plant nickname
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g. Monstera Mike"
          required
        />
      </label>

      <label>
        Last watered
        <input
          type="date"
          value={lastWatered}
          onChange={(e) => setLastWatered(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          required
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Analyzing…' : 'Add Plant'}
      </button>

      {status && (
        <p className={`form-status ${status.ok ? 'ok' : 'error'}`}>
          {status.message}
        </p>
      )}
    </form>
  )
}
