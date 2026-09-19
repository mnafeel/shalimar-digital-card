import { useEffect, useState } from 'react'
import { loadCardData } from '../data/cardStore'
import { renderDigitalCardImage } from '../utils/shareCardImage'

/** Dev/preview helper: shows the shareable visiting-card image */
export default function SharePreviewPage() {
  const [url, setUrl] = useState<string>('')
  const [error, setError] = useState('')

  useEffect(() => {
    let revoked = false
    let objectUrl = ''
    ;(async () => {
      try {
        const blob = await renderDigitalCardImage(
          loadCardData(),
          'https://digitalcard.shalimarfashions.com',
        )
        objectUrl = URL.createObjectURL(blob)
        if (!revoked) setUrl(objectUrl)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to render')
      }
    })()
    return () => {
      revoked = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [])

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#ebe6de',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        fontFamily: 'Figtree, system-ui, sans-serif',
      }}
    >
      <div style={{ width: 'min(100%, 900px)', textAlign: 'center' }}>
        <p style={{ marginBottom: '1rem', color: '#7f6852', letterSpacing: '0.12em', fontSize: 12, fontWeight: 600 }}>
          SHAREABLE VISITING CARD · WHITE LOGO ON PHOTO · STANDARD QR
        </p>
        {error ? <p style={{ color: '#c45c5c' }}>{error}</p> : null}
        {url ? (
          <img
            src={url}
            alt="Shalimar Fashions digital visiting card"
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: 12,
              boxShadow: '0 18px 48px rgba(70,55,50,0.18)',
            }}
          />
        ) : (
          !error && <p style={{ color: '#9b8168' }}>Generating card…</p>
        )}
      </div>
    </div>
  )
}
