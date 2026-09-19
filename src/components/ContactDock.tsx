import type { CardData } from '../data/cardStore'
import { instagramHandle, telHref, whatsappHref } from '../data/cardStore'
import './ContactDock.css'

interface Props {
  data: CardData
}

export default function ContactDock({ data }: Props) {
  const handle = instagramHandle(data.instagram)

  return (
    <nav className="dock" aria-label="Quick links">
      <a
        className="dock__item dock__item--ig"
        href={data.instagram}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="dock__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
          </svg>
        </span>
        <span>{handle ? 'Instagram' : 'Instagram'}</span>
      </a>
      <a className="dock__item dock__item--call" href={telHref(data.phone)}>
        <span className="dock__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M8.5 4.5h2.2l1.1 3.2-1.6 1.1a12.5 12.5 0 0 0 5 5l1.1-1.6 3.2 1.1v2.2a1.5 1.5 0 0 1-1.5 1.5A14.5 14.5 0 0 1 4 6a1.5 1.5 0 0 1 1.5-1.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span>Call</span>
      </a>
      <a
        className="dock__item dock__item--wa"
        href={whatsappHref(data.whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="dock__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L4 20.5l4.3-.7A8.5 8.5 0 1 0 12 3.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </span>
        <span>WhatsApp</span>
      </a>
      <a
        className="dock__item dock__item--fb"
        href={data.facebook}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="dock__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M14 8.5h2.5V5.8c-.4-.05-1.5-.15-2.8-.15-2.8 0-4.7 1.7-4.7 4.85V13H6.5v3h2.5v7h3.2v-7h2.6l.5-3h-3.1V11c0-.9.25-1.5 1.5-1.5Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span>Facebook</span>
      </a>
    </nav>
  )
}
