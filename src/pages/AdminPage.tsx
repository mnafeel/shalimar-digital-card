import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  DEFAULT_CARD,
  isAdminAuthenticated,
  loadCardData,
  resetCardData,
  saveCardData,
  setAdminSession,
  verifyAdminPassword,
  type CardData,
  type ExperienceMoment,
} from '../data/cardStore'
import AmbientBackground from '../components/AmbientBackground'
import './AdminPage.css'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [data, setData] = useState<CardData>(DEFAULT_CARD)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isAdminAuthenticated()) {
      setAuthed(true)
      setData(loadCardData())
    }
  }, [])

  const login = (e: FormEvent) => {
    e.preventDefault()
    if (verifyAdminPassword(password)) {
      setAdminSession(true)
      setAuthed(true)
      setData(loadCardData())
      setError('')
      setPassword('')
    } else {
      setError('Incorrect password')
    }
  }

  const logout = () => {
    setAdminSession(false)
    setAuthed(false)
  }

  const update = <K extends keyof CardData>(key: K, value: CardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const updateMoment = (index: number, patch: Partial<ExperienceMoment>) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    }))
    setSaved(false)
  }

  const addMoment = () => {
    setData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: `moment-${Date.now()}`,
          title: 'New moment',
          subtitle: 'Describe this part of the boutique journey.',
          image: '/experience/frame-01.jpg',
        },
      ],
    }))
    setSaved(false)
  }

  const removeMoment = (index: number) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }))
    setSaved(false)
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    saveCardData(data)
    window.dispatchEvent(new Event('sf-card-updated'))
    setSaved(true)
  }

  const reset = () => {
    const fresh = resetCardData()
    setData(fresh)
    window.dispatchEvent(new Event('sf-card-updated'))
    setSaved(true)
  }

  if (!authed) {
    return (
      <div className="admin">
        <AmbientBackground />
        <div className="admin__shell admin__shell--login">
          <img className="admin__logo" src="/brand/logo-hero-brown.png" alt="Shalimar Fashions" />
          <h1>Admin Access</h1>
          <p className="admin__sub">Update your digital presence securely.</p>
          <form className="admin__login" onSubmit={login}>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
                required
              />
            </label>
            {error ? <p className="admin__error">{error}</p> : null}
            <button type="submit" className="admin__primary">
              Enter Studio
            </button>
          </form>
          <Link className="admin__back" to="/">
            ← Back to card
          </Link>
          <p className="admin__hint">Default password: shalimar2024</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin">
      <AmbientBackground />
      <div className="admin__shell">
        <header className="admin__header">
          <div>
            <p className="admin__kicker">Control Studio</p>
            <h1>Edit Digital Card</h1>
          </div>
          <div className="admin__header-actions">
            <Link to="/" className="admin__ghost">
              View Card
            </Link>
            <button type="button" className="admin__ghost" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <form className="admin__form" onSubmit={save}>
          <fieldset>
            <legend>Brand</legend>
            <Field label="Brand name" value={data.brandName} onChange={(v) => update('brandName', v)} />
            <Field label="Tagline" value={data.tagline} onChange={(v) => update('tagline', v)} />
            <Field label="Accent note" value={data.accentNote} onChange={(v) => update('accentNote', v)} />
            <Field label="Logo URL" value={data.logoUrl} onChange={(v) => update('logoUrl', v)} />
            <Field label="Logo icon URL" value={data.logoIconUrl} onChange={(v) => update('logoIconUrl', v)} />
            <Field
              label="Shop front image URL"
              value={data.shopFrontUrl}
              onChange={(v) => update('shopFrontUrl', v)}
            />
            <Field
              label="Map pin photo URL"
              value={data.shopPinUrl}
              onChange={(v) => update('shopPinUrl', v)}
            />
            <Field
              label="Wallpaper image URL"
              value={data.wallpaperUrl}
              onChange={(v) => update('wallpaperUrl', v)}
            />
            <Field label="Owner / display name" value={data.ownerName} onChange={(v) => update('ownerName', v)} />
            <Field label="Designation" value={data.designation} onChange={(v) => update('designation', v)} />
            <Field label="About" value={data.about} onChange={(v) => update('about', v)} multiline />
          </fieldset>

          <fieldset>
            <legend>Contact</legend>
            <Field label="Phone (primary)" value={data.phone} onChange={(v) => update('phone', v)} />
            <Field
              label="Phone (secondary)"
              value={data.phoneSecondary}
              onChange={(v) => update('phoneSecondary', v)}
            />
            <Field
              label="WhatsApp (country code + number)"
              value={data.whatsapp}
              onChange={(v) => update('whatsapp', v)}
            />
            <Field label="Email" value={data.email} onChange={(v) => update('email', v)} />
            <Field label="Website" value={data.website} onChange={(v) => update('website', v)} />
          </fieldset>

          <fieldset>
            <legend>Social</legend>
            <Field label="Instagram URL" value={data.instagram} onChange={(v) => update('instagram', v)} />
            <Field label="Facebook URL" value={data.facebook} onChange={(v) => update('facebook', v)} />
            <Field label="YouTube URL (optional)" value={data.youtube} onChange={(v) => update('youtube', v)} />
          </fieldset>

          <fieldset>
            <legend>Location</legend>
            <Field label="Address" value={data.address} onChange={(v) => update('address', v)} multiline />
            <Field label="Google Maps link" value={data.mapLink} onChange={(v) => update('mapLink', v)} />
            <Field
              label="Google Maps embed URL"
              value={data.mapEmbedUrl}
              onChange={(v) => update('mapEmbedUrl', v)}
              multiline
            />
          </fieldset>

          <fieldset>
            <legend>Boutique Journey</legend>
            <p className="admin__help">
              These moments power the scroll experience. Use images from <code>/experience/</code> or any URL.
            </p>
            {data.experience.map((moment, index) => (
              <div className="admin__video" key={moment.id}>
                <Field
                  label="Title"
                  value={moment.title}
                  onChange={(v) => updateMoment(index, { title: v })}
                />
                <Field
                  label="Subtitle"
                  value={moment.subtitle}
                  onChange={(v) => updateMoment(index, { subtitle: v })}
                  multiline
                />
                <Field
                  label="Image path / URL"
                  value={moment.image}
                  onChange={(v) => updateMoment(index, { image: v })}
                />
                <button type="button" className="admin__danger" onClick={() => removeMoment(index)}>
                  Remove moment
                </button>
              </div>
            ))}
            <button type="button" className="admin__ghost" onClick={addMoment}>
              + Add journey moment
            </button>
          </fieldset>

          <div className="admin__actions">
            <button type="submit" className="admin__primary">
              Save Changes
            </button>
            <button type="button" className="admin__ghost" onClick={reset}>
              Reset to defaults
            </button>
            {saved ? <span className="admin__saved">Saved</span> : null}
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
}) {
  return (
    <label className="admin__field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  )
}
