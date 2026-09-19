import type { ReactNode } from 'react'
import type { CardData } from '../data/cardStore'
import { instagramHandle, mailHref, telHref, whatsappHref } from '../data/cardStore'
import './ConnectHub.css'

interface Props {
  data: CardData
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.5 4.5h2.2l1.1 3.2-1.6 1.1a12.5 12.5 0 0 0 5 5l1.1-1.6 3.2 1.1v2.2a1.5 1.5 0 0 1-1.5 1.5A14.5 14.5 0 0 1 4 6a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconWa() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L4 20.5l4.3-.7A8.5 8.5 0 1 0 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9.4 9.2c.2-.4.5-.4.8-.4h.6c.2 0 .35.1.4.35l.7 1.7c.08.2 0 .4-.15.5l-.55.35a5.5 5.5 0 0 0 2.35 2.35l.35-.55c.12-.18.35-.25.55-.15l1.7.7c.22.08.35.2.35.4v.6c0 .3 0 .55-.4.8-.4.28-1 .45-2 .2-1.65-.4-3.4-1.7-4.65-2.95-1.25-1.25-2.55-3-2.95-4.65-.25-1-.08-1.6.2-2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconIg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.05" fill="currentColor" />
    </svg>
  )
}

function IconFb() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 8.5h2.5V5.8c-.4-.05-1.5-.15-2.8-.15-2.8 0-4.7 1.7-4.7 4.85V13H6.5v3h2.5v7h3.2v-7h2.6l.5-3h-3.1V11c0-.9.25-1.5 1.5-1.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

function IconMap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

interface Tile {
  label: string
  href: string
  className: string
  icon: ReactNode
  external?: boolean
}

export default function ConnectHub({ data }: Props) {
  const handle = instagramHandle(data.instagram)

  const tiles: Tile[] = [
    {
      label: handle ? `@${handle}` : 'Instagram',
      href: data.instagram,
      className: 'connect__btn--ig',
      icon: <IconIg />,
      external: true,
    },
    {
      label: 'Call',
      href: telHref(data.phone),
      className: 'connect__btn--call',
      icon: <IconPhone />,
    },
    {
      label: 'WhatsApp',
      href: whatsappHref(data.whatsapp),
      className: 'connect__btn--wa',
      icon: <IconWa />,
      external: true,
    },
    {
      label: 'Email',
      href: mailHref(data.email),
      className: 'connect__btn--mail',
      icon: <IconMail />,
    },
    {
      label: 'Facebook',
      href: data.facebook,
      className: 'connect__btn--fb',
      icon: <IconFb />,
      external: true,
    },
    {
      label: 'Maps',
      href: data.mapLink,
      className: 'connect__btn--map',
      icon: <IconMap />,
      external: true,
    },
  ].filter((t) => t.href?.trim())

  return (
    <section className="connect" aria-label="Quick actions">
      <div className="connect__row">
        {tiles.map((tile) => (
          <a
            key={tile.label}
            className={`connect__btn ${tile.className}`}
            href={tile.href}
            target={tile.external ? '_blank' : undefined}
            rel={tile.external ? 'noopener noreferrer' : undefined}
            title={tile.label}
          >
            <span className="connect__icon">{tile.icon}</span>
            <span className="connect__label">{tile.label}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
