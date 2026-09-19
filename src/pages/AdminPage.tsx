import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  DEFAULT_CARD,
  fetchCardDataCloud,
  isAdminAuthenticated,
  loadCardData,
  resetCardData,
  saveCardData,
  setAdminSession,
  verifyAdminPassword,
  type CardData,
  type ExperienceMoment,
} from '../data/cardStore'
import {
  addRegisteredUser,
  buildShareUrl,
  CARD_PUBLIC_URL,
  createShareLink,
  loadRegisteredUsers,
  loadShareLinks,
  removeRegisteredUser,
  removeShareLink,
  setShareLinkPublished,
  whatsappShareHref,
  type RegisteredUser,
  type ShareLink,
} from '../data/shareLinksStore'
import {
  formatVisitTime,
  loadVisits,
  summarizeVisits,
  type VisitRecord,
} from '../data/visitStore'
import { downloadPortraitPrint } from '../utils/portraitPrintImage'
import AmbientBackground from '../components/AmbientBackground'
import './AdminPage.css'

type AdminTab = 'edit' | 'share' | 'visitors'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [data, setData] = useState<CardData>(DEFAULT_CARD)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<AdminTab>('edit')

  const [links, setLinks] = useState<ShareLink[]>([])
  const [users, setUsers] = useState<RegisteredUser[]>([])
  const [linkLabel, setLinkLabel] = useState('')
  const [linkOwner, setLinkOwner] = useState('Admin')
  const [newUserName, setNewUserName] = useState('')
  const [copyNote, setCopyNote] = useState('')
  const [printNote, setPrintNote] = useState('')
  const [printing, setPrinting] = useState<'color' | 'mono' | null>(null)

  const [visits, setVisits] = useState<VisitRecord[]>([])

  const refreshVisits = async () => {
    const list = await loadVisits()
    setVisits(list)
  }

  useEffect(() => {
    if (isAdminAuthenticated()) {
      setAuthed(true)
      setData(loadCardData())
      void fetchCardDataCloud().then(setData)
      setLinks(loadShareLinks())
      setUsers(loadRegisteredUsers())
      void refreshVisits()
    }
  }, [])

  const stats = useMemo(() => summarizeVisits(visits), [visits])

  const login = (e: FormEvent) => {
    e.preventDefault()
    if (verifyAdminPassword(password)) {
      setAdminSession(true)
      setAuthed(true)
      setData(loadCardData())
      void fetchCardDataCloud().then(setData)
      setLinks(loadShareLinks())
      setUsers(loadRegisteredUsers())
      void refreshVisits()
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

  const flashCopy = (msg: string) => {
    setCopyNote(msg)
    window.setTimeout(() => setCopyNote(''), 2000)
  }

  const copyText = async (text: string, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(text)
      flashCopy(okMsg)
    } catch {
      flashCopy('Copy failed')
    }
  }

  const publishLink = (e: FormEvent) => {
    e.preventDefault()
    if (!linkLabel.trim()) return
    const created = createShareLink(linkLabel, linkOwner)
    setLinks(loadShareLinks())
    setLinkLabel('')
    void copyText(buildShareUrl(created.slug), 'Link published & copied')
  }

  const downloadPrint = async (style: 'color' | 'mono') => {
    if (printing) return
    setPrinting(style)
    setPrintNote(style === 'mono' ? 'Preparing B&W…' : 'Preparing color…')
    try {
      await downloadPortraitPrint(data, style, CARD_PUBLIC_URL)
      setPrintNote(style === 'mono' ? 'B&W downloaded' : 'Color downloaded')
    } catch {
      setPrintNote('Download failed')
    } finally {
      setPrinting(null)
      window.setTimeout(() => setPrintNote(''), 2200)
    }
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
      <div className="admin__shell admin__shell--wide">
        <header className="admin__header">
          <div>
            <p className="admin__kicker">Control Studio</p>
            <h1>Digital Card Admin</h1>
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

        <nav className="admin__tabs" aria-label="Admin sections">
          <button
            type="button"
            className={tab === 'edit' ? 'admin__tab is-active' : 'admin__tab'}
            onClick={() => setTab('edit')}
          >
            Edit card
          </button>
          <button
            type="button"
            className={tab === 'share' ? 'admin__tab is-active' : 'admin__tab'}
            onClick={() => setTab('share')}
          >
            Share & print
          </button>
          <button
            type="button"
            className={tab === 'visitors' ? 'admin__tab is-active' : 'admin__tab'}
            onClick={() => {
              setTab('visitors')
              void refreshVisits()
            }}
          >
            Visitors
          </button>
        </nav>

        {tab === 'edit' ? (
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
              <Field label="Phone" value={data.phone} onChange={(v) => update('phone', v)} />
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
        ) : null}

        {tab === 'share' ? (
          <div className="admin__panel">
            <section className="admin__card">
              <h2>Public card link</h2>
              <p className="admin__help">Share this URL directly — QR prints also open this page.</p>
              <div className="admin__link-row">
                <code className="admin__code">{CARD_PUBLIC_URL}</code>
                <button
                  type="button"
                  className="admin__primary"
                  onClick={() => void copyText(CARD_PUBLIC_URL, 'Card link copied')}
                >
                  Copy link
                </button>
                <a
                  className="admin__ghost"
                  href={whatsappShareHref(CARD_PUBLIC_URL, data.brandName)}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
              {copyNote ? <p className="admin__saved">{copyNote}</p> : null}
            </section>

            <section className="admin__card">
              <h2>Printable portrait downloads</h2>
              <p className="admin__help">
                High-quality portrait PNGs with a scannable QR — ready to print. Black &amp; white is a premium
                logo + QR layout (not a plain photo).
              </p>
              <div className="admin__btn-row">
                <button
                  type="button"
                  className="admin__primary"
                  disabled={!!printing}
                  onClick={() => void downloadPrint('color')}
                >
                  {printing === 'color' ? 'Preparing…' : 'Download color portrait'}
                </button>
                <button
                  type="button"
                  className="admin__ghost admin__ghost--strong"
                  disabled={!!printing}
                  onClick={() => void downloadPrint('mono')}
                >
                  {printing === 'mono' ? 'Preparing…' : 'Download B&W portrait'}
                </button>
              </div>
              {printNote ? <p className="admin__saved">{printNote}</p> : null}
            </section>

            <section className="admin__card">
              <h2>Registered publishers</h2>
              <p className="admin__help">People who can create and publish share links from this studio.</p>
              <form
                className="admin__inline-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  setUsers(addRegisteredUser(newUserName))
                  setNewUserName('')
                }}
              >
                <input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Add publisher name"
                  required
                />
                <button type="submit" className="admin__ghost">
                  Add
                </button>
              </form>
              <ul className="admin__list">
                {users.map((u) => (
                  <li key={u.id}>
                    <span>{u.name}</span>
                    {u.id !== 'user-admin' ? (
                      <button
                        type="button"
                        className="admin__danger admin__danger--tiny"
                        onClick={() => setUsers(removeRegisteredUser(u.id))}
                      >
                        Remove
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section className="admin__card">
              <h2>Create &amp; publish share links</h2>
              <p className="admin__help">
                Named links for campaigns (WhatsApp, print, staff). Opens are counted when visitors use the
                link.
              </p>
              <form className="admin__inline-form admin__inline-form--stack" onSubmit={publishLink}>
                <label className="admin__field">
                  <span>Link label</span>
                  <input
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    placeholder="e.g. Market Road flyer · March"
                    required
                  />
                </label>
                <label className="admin__field">
                  <span>Published by</span>
                  <select value={linkOwner} onChange={(e) => setLinkOwner(e.target.value)}>
                    {users.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="admin__primary">
                  Publish link
                </button>
              </form>

              <ul className="admin__link-list">
                {links.length === 0 ? (
                  <li className="admin__empty">No published links yet.</li>
                ) : (
                  links.map((link) => {
                    const url = buildShareUrl(link.slug)
                    return (
                      <li key={link.id} className={!link.published ? 'is-paused' : undefined}>
                        <div>
                          <strong>{link.label}</strong>
                          <p>
                            {link.createdBy} · {formatVisitTime(link.createdAt)} · {link.opens} opens
                            {!link.published ? ' · paused' : ''}
                          </p>
                          <code>{url}</code>
                        </div>
                        <div className="admin__link-actions">
                          <button
                            type="button"
                            className="admin__ghost"
                            onClick={() => void copyText(url, 'Share link copied')}
                          >
                            Copy
                          </button>
                          <a
                            className="admin__ghost"
                            href={whatsappShareHref(url, data.brandName)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            WhatsApp
                          </a>
                          <button
                            type="button"
                            className="admin__ghost"
                            onClick={() => setLinks(setShareLinkPublished(link.id, !link.published))}
                          >
                            {link.published ? 'Pause' : 'Publish'}
                          </button>
                          <button
                            type="button"
                            className="admin__danger admin__danger--tiny"
                            onClick={() => setLinks(removeShareLink(link.id))}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    )
                  })
                )}
              </ul>
            </section>
          </div>
        ) : null}

        {tab === 'visitors' ? (
          <div className="admin__panel">
            <section className="admin__card">
              <h2>Traffic overview</h2>
              <p className="admin__help">
                Every card open is stored permanently in the cloud (one entry per browser tab session). Counts
                stay available from any browser — visitor data is never deleted.
              </p>
              <div className="admin__stats">
                <div>
                  <strong>{stats.total}</strong>
                  <span>Total visits</span>
                </div>
                <div>
                  <strong>{stats.today}</strong>
                  <span>Today</span>
                </div>
                <div>
                  <strong>{stats.mobile}</strong>
                  <span>Mobile</span>
                </div>
                <div>
                  <strong>{stats.desktop}</strong>
                  <span>Desktop</span>
                </div>
                <div>
                  <strong>{stats.tablet}</strong>
                  <span>Tablet</span>
                </div>
              </div>
              <div className="admin__btn-row">
                <button type="button" className="admin__ghost" onClick={() => void refreshVisits()}>
                  Refresh
                </button>
              </div>
            </section>

            <section className="admin__card">
              <h2>Devices &amp; browsers</h2>
              <ul className="admin__list admin__list--split">
                {Object.entries(stats.byBrowser).map(([name, count]) => (
                  <li key={name}>
                    <span>{name}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
                {Object.entries(stats.byOs).map(([name, count]) => (
                  <li key={`os-${name}`}>
                    <span>{name}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
                {Object.keys(stats.byBrowser).length === 0 ? (
                  <li className="admin__empty">No traffic recorded yet — open the card once to seed data.</li>
                ) : null}
              </ul>
            </section>

            <section className="admin__card">
              <h2>Visit log</h2>
              <div className="admin__table-wrap">
                <table className="admin__table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Device</th>
                      <th>Browser</th>
                      <th>OS</th>
                      <th>Screen</th>
                      <th>Language</th>
                      <th>Link</th>
                      <th>Path</th>
                      <th>Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="admin__empty">
                          No visits yet.
                        </td>
                      </tr>
                    ) : (
                      visits.map((v) => (
                        <tr key={v.id}>
                          <td>{formatVisitTime(v.at)}</td>
                          <td>{v.device}</td>
                          <td>{v.browser}</td>
                          <td>{v.os}</td>
                          <td>{v.screen || '—'}</td>
                          <td>{v.language || '—'}</td>
                          <td>{v.shareSlug || 'direct'}</td>
                          <td>{v.path || '—'}</td>
                          <td>{v.referrer || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
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
