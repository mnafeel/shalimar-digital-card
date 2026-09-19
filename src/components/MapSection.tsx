import type { CardData } from '../data/cardStore'
import Reveal from './Reveal'
import './MapSection.css'

interface Props {
  data: CardData
}

export default function MapSection({ data }: Props) {
  // Place-centered embed so Google pins Shalimar Fashions itself
  const embed =
    data.mapEmbedUrl ||
    `https://maps.google.com/maps?q=${encodeURIComponent(
      'Shalimar Fashions, Market Road, Ernakulam',
    )}&hl=en&t=k&z=18&output=embed`

  const front = data.shopFrontUrl || '/shop/front.jpg'
  const pin = data.shopPinUrl || '/shop/pin.jpg'

  return (
    <Reveal>
      <section className="map-section">
        <div className="section-head section-head--compact">
          <p className="section-kicker">Location</p>
          <h2>Find Shalimar</h2>
        </div>

        <div className="map-card">
          <a
            className="map-place"
            href={data.mapLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img className="map-place__photo" src={pin} alt="" />
            <div className="map-place__copy">
              <p className="map-place__name">Shalimar Fashions</p>
              <p className="map-place__addr">{data.address}</p>
              <span className="map-place__cta">Exact shop location · Open Maps</span>
            </div>
            <img className="map-place__cover" src={front} alt="" />
          </a>

          <div className="map-card__frame">
            <iframe
              title="Shalimar Fashions on Google Maps"
              src={embed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </Reveal>
  )
}
