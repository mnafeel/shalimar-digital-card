import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import {
  loadCardData,
  instagramHandle,
  mailHref,
  telHref,
  whatsappHref,
  type CardData,
} from '../data/cardStore'
import './CardModel3D.css'

export default function CardModel3D() {
  const [data, setData] = useState<CardData>(() => loadCardData())
  const [ready, setReady] = useState(false)
  const reduce = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 90, damping: 18 })
  const sy = useSpring(my, { stiffness: 90, damping: 18 })

  const cardRX = useTransform(sy, [-0.5, 0.5], [14, -14])
  const cardRY = useTransform(sx, [-0.5, 0.5], [-18, 18])
  const logoLift = useTransform(sx, [-0.5, 0.5], [36, 64])
  const glowX = useTransform(sx, [-0.5, 0.5], ['30%', '70%'])
  const glowY = useTransform(sy, [-0.5, 0.5], ['25%', '60%'])

  useEffect(() => {
    const refresh = () => setData(loadCardData())
    window.addEventListener('storage', refresh)
    window.addEventListener('sf-card-updated', refresh)
    const t = window.setTimeout(() => setReady(true), 80)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('sf-card-updated', refresh)
      window.clearTimeout(t)
    }
  }, [])

  const onMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (reduce || !stageRef.current) return
      const r = stageRef.current.getBoundingClientRect()
      mx.set((e.clientX - r.left) / r.width - 0.5)
      my.set((e.clientY - r.top) / r.height - 0.5)
    },
    [mx, my, reduce],
  )

  const onLeave = useCallback(() => {
    mx.set(0)
    my.set(0)
  }, [mx, my])

  const handle = instagramHandle(data.instagram)
  const actions = [
    { id: 'ig', label: 'Instagram', href: data.instagram, tone: 'ig' },
    { id: 'call', label: 'Call', href: telHref(data.phone), tone: 'call' },
    { id: 'wa', label: 'WhatsApp', href: whatsappHref(data.whatsapp), tone: 'wa' },
    { id: 'mail', label: 'Email', href: mailHref(data.email), tone: 'mail' },
    { id: 'fb', label: 'Facebook', href: data.facebook, tone: 'fb' },
    { id: 'map', label: 'Maps', href: data.mapLink, tone: 'map' },
  ].filter((a) => a.href?.trim())

  return (
    <div className="m3d">
      <div className="m3d__space" aria-hidden="true">
        <div className="m3d__nebula m3d__nebula--a" />
        <div className="m3d__nebula m3d__nebula--b" />
        <div className="m3d__grid" />
        <div className="m3d__particles">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} style={{ ['--i' as string]: i }} />
          ))}
        </div>
      </div>

      <Link className="m3d__switch" to="/">
        ← Classic model
      </Link>

      <div
        ref={stageRef}
        className="m3d__stage"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <motion.article
          className="m3d__card"
          style={
            reduce
              ? undefined
              : {
                  rotateX: cardRX,
                  rotateY: cardRY,
                  transformStyle: 'preserve-3d',
                }
          }
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={ready ? { opacity: 1, y: 0, scale: 1 } : undefined}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="m3d__sheen"
            style={reduce ? undefined : { backgroundPosition: `${glowX} ${glowY}` }}
            aria-hidden="true"
          />

          <div className="m3d__badge">
            <span />
            3D Digital Card · Preview
          </div>

          <p className="m3d__loc">{data.accentNote}</p>

          <div className="m3d__logo-scene">
            <div className="m3d__orbit m3d__orbit--a" aria-hidden="true" />
            <div className="m3d__orbit m3d__orbit--b" aria-hidden="true" />
            <div className="m3d__orbit m3d__orbit--c" aria-hidden="true" />

            <motion.div
              className="m3d__logo-stack"
              style={
                reduce
                  ? undefined
                  : {
                      transformStyle: 'preserve-3d',
                      translateZ: logoLift,
                    }
              }
              animate={
                reduce
                  ? undefined
                  : {
                      rotateY: [0, 12, -10, 6, 0],
                      rotateX: [0, -8, 6, -4, 0],
                      scale: [1, 1.08, 0.97, 1.04, 1],
                      y: [0, -10, 4, -6, 0],
                    }
              }
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img className="m3d__logo m3d__logo--shadow" src={data.logoUrl} alt="" aria-hidden="true" />
              <img className="m3d__logo m3d__logo--mid" src={data.logoUrl} alt="" aria-hidden="true" />
              <img className="m3d__logo m3d__logo--front" src={data.logoUrl} alt={data.brandName} />
            </motion.div>
          </div>

          <h1 className="m3d__title">{data.brandName}</h1>
          <p className="m3d__tag">{data.tagline}</p>

          <div className="m3d__actions">
            {actions.map((action, i) => (
              <motion.a
                key={action.id}
                className={`m3d__chip m3d__chip--${action.tone}`}
                href={action.href}
                target={action.href.startsWith('http') ? '_blank' : undefined}
                rel={action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                style={{ transform: `translateZ(${28 + i * 2}px)` }}
                whileHover={reduce ? undefined : { z: 56, scale: 1.06, y: -4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              >
                <span className="m3d__chip-icon" aria-hidden="true">
                  {action.id === 'ig' && '◎'}
                  {action.id === 'call' && '☎'}
                  {action.id === 'wa' && '✦'}
                  {action.id === 'mail' && '✉'}
                  {action.id === 'fb' && 'f'}
                  {action.id === 'map' && '⌖'}
                </span>
                <span>{action.id === 'ig' && handle ? `@${handle.slice(0, 10)}` : action.label}</span>
              </motion.a>
            ))}
          </div>

          <div className="m3d__place" style={{ transform: 'translateZ(24px)' }}>
            <img src={data.shopPinUrl} alt="" className="m3d__place-photo" />
            <div>
              <p className="m3d__place-name">Find Shalimar</p>
              <p className="m3d__place-addr">{data.address}</p>
            </div>
            <a className="m3d__place-go" href={data.mapLink} target="_blank" rel="noopener noreferrer">
              Open
            </a>
          </div>

          <div className="m3d__map" style={{ transform: 'translateZ(18px) rotateX(8deg)' }}>
            <iframe
              title="Shalimar Fashions map"
              src={data.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </motion.article>
      </div>
    </div>
  )
}
