import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  loadCardData,
  downloadVCard,
  instagramHandle,
  mailHref,
  telHref,
  whatsappHref,
  type CardData,
} from '../data/cardStore'
import { shareDigitalCard } from '../utils/shareCardImage'
import './DigitalCard.css'

const ease = [0.22, 1, 0.36, 1] as const

const fadeUp = (delay = 0, reduce?: boolean | null) =>
  reduce
    ? undefined
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.48, delay, ease },
      }

export default function DigitalCard() {
  const [data, setData] = useState<CardData>(() => loadCardData())
  const [ready, setReady] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const [shareNote, setShareNote] = useState('')
  const [saveNote, setSaveNote] = useState('')
  const [sharing, setSharing] = useState(false)
  const reduce = useReducedMotion()
  const introLocked = useRef(false)
  const logoSlotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const refresh = () => setData(loadCardData())
    window.addEventListener('storage', refresh)
    window.addEventListener('sf-card-updated', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('sf-card-updated', refresh)
    }
  }, [])

  const finishIntro = useCallback(() => {
    if (introLocked.current) return
    introLocked.current = true
    setIntroDone(true)
    window.setTimeout(() => setReady(true), 40)
  }, [])

  useEffect(() => {
    if (reduce) finishIntro()
  }, [reduce, finishIntro])

  // Hard guarantee: never leave the dark intro stage stuck
  useEffect(() => {
    if (introDone || reduce) return
    const hard = window.setTimeout(finishIntro, 3600)
    return () => window.clearTimeout(hard)
  }, [introDone, reduce, finishIntro])

  const handle = instagramHandle(data.instagram)
  const logoSrc = '/brand/logo-hero-white.png'
  const cardUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`.replace(/\/$/, '') ||
        window.location.href.split('?')[0]
      : 'https://digitalcard.shalimarfashions.com'

  const shareCard = async () => {
    if (sharing) return
    setSharing(true)
    setShareNote('Preparing…')
    try {
      const result = await shareDigitalCard(data, cardUrl || window.location.href)
      if (result === 'cancelled') {
        setShareNote('')
        return
      }
      if (result === 'shared') setShareNote('Shared')
      else if (result === 'copied') setShareNote('Link copied')
      else setShareNote('Card saved')
      window.setTimeout(() => setShareNote(''), 2000)
    } catch {
      setShareNote('Try again')
      window.setTimeout(() => setShareNote(''), 1800)
    } finally {
      setSharing(false)
    }
  }

  const saveContact = async () => {
    setSaveNote('Saving…')
    try {
      await downloadVCard(data)
      setSaveNote('Done')
    } catch {
      setSaveNote('Try again')
    }
    window.setTimeout(() => setSaveNote(''), 1600)
  }

  return (
    <div className="folio">
      <div className="folio__wash" aria-hidden="true" />

      <AnimatePresence>
        {!introDone && !reduce ? (
          <CinematicIntro
            key="intro"
            logoSrc={logoSrc}
            slotRef={logoSlotRef}
            onDone={finishIntro}
          />
        ) : null}
      </AnimatePresence>

      <motion.main
        className="folio__sheet"
        initial={reduce ? false : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="folio__hero">
          <img
            className="folio__hero-img"
            src={data.shopFrontUrl || data.wallpaperUrl}
            alt=""
          />
          <div className="folio__hero-veil" />
          <Logo3D
            src={logoSrc}
            alt={data.brandName}
            active={ready}
            reduce={!!reduce}
            slotRef={logoSlotRef}
            visible={introDone || !!reduce}
          />
          <div className="folio__hero-caption" aria-hidden="true">
            <p>{data.accentNote}</p>
            <p>{data.designation}</p>
          </div>
        </div>

        <div className="folio__panel">
          <motion.header className="folio__intro" {...fadeUp(0.08, reduce || !ready)}>
            <p className="folio__kicker">{data.accentNote}</p>
            <TypedBrand active={ready} reduce={!!reduce} />
            <p className="folio__tag">{data.tagline}</p>
            {data.about ? <p className="folio__about">{data.about}</p> : null}
          </motion.header>

          <motion.section
            className="folio__spotlight"
            aria-label="Primary contact"
            {...fadeUp(0.16, reduce || !ready)}
          >
            <div className="folio-spot folio-spot--call folio-spot--call-duo">
              <IconCall />
              <div className="folio-spot__stack">
                <strong>Call</strong>
                <a className="folio-spot__tel" href={telHref(data.phone)}>
                  {data.phone}
                </a>
                {data.phoneSecondary ? (
                  <a className="folio-spot__tel folio-spot__tel--alt" href={telHref(data.phoneSecondary)}>
                    {data.phoneSecondary}
                  </a>
                ) : null}
              </div>
            </div>
            <a
              className="folio-spot folio-spot--wa"
              href={whatsappHref(data.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconWa />
              <span>
                <strong>WhatsApp</strong>
                <small>Chat</small>
              </span>
            </a>
            <button type="button" className="folio-spot folio-spot--save" onClick={saveContact}>
              <IconSave />
              <span>
                <strong>Save</strong>
                <small>{saveNote || 'Both numbers'}</small>
              </span>
            </button>
            <button
              type="button"
              className="folio-spot folio-spot--share"
              onClick={shareCard}
              disabled={sharing}
            >
              <IconShare />
              <span>
                <strong>Share</strong>
                <small>{shareNote || 'Digital card'}</small>
              </span>
            </button>
          </motion.section>

          <motion.section
            className="folio__connect"
            aria-label="More ways to connect"
            {...fadeUp(0.24, reduce || !ready)}
          >
            <h2>Connect</h2>
            <div className="folio__connect-grid">
              <a className="folio-tile" href={data.instagram} target="_blank" rel="noopener noreferrer">
                <span className="folio-ico folio-ico--ig" aria-hidden="true">
                  <IconIg />
                </span>
                <strong>Instagram</strong>
                <span>{handle ? `@${handle}` : 'Follow'}</span>
              </a>
              <a className="folio-tile" href={data.facebook} target="_blank" rel="noopener noreferrer">
                <span className="folio-ico folio-ico--fb" aria-hidden="true">
                  <IconFb />
                </span>
                <strong>Facebook</strong>
                <span>Page</span>
              </a>
              <a className="folio-tile" href={mailHref(data.email)}>
                <span className="folio-ico folio-ico--mail" aria-hidden="true">
                  <IconMail />
                </span>
                <strong>Email</strong>
                <span>Write us</span>
              </a>
              <a className="folio-tile" href={data.website} target="_blank" rel="noopener noreferrer">
                <span className="folio-ico folio-ico--web" aria-hidden="true">
                  <IconWeb />
                </span>
                <strong>Website</strong>
                <span>Visit</span>
              </a>
            </div>
          </motion.section>

          <motion.section className="folio__visit" aria-label="Location" {...fadeUp(0.3, reduce || !ready)}>
            <div className="folio__visit-head">
              <h2>Find Shalimar Fashions</h2>
              <p>{data.address}</p>
            </div>

            <div className="folio__maps">
              <a
                className="folio__maps-card"
                href={data.mapLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={data.shopPinUrl || data.shopFrontUrl} alt="" />
                <div>
                  <strong>Google Maps</strong>
                  <span>Directions to the boutique</span>
                </div>
                <IconArrow />
              </a>
              <div className="folio__map">
                <iframe
                  title="Shalimar Fashions satellite map"
                  src={data.mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </motion.section>

          <footer className="folio__foot">
            <img src={data.logoIconUrl} alt="" />
            <span>{data.designation}</span>
          </footer>
        </div>
      </motion.main>
    </div>
  )
}

function CinematicIntro({
  logoSrc,
  slotRef,
  onDone,
}: {
  logoSrc: string
  slotRef: RefObject<HTMLDivElement | null>
  onDone: () => void
}) {
  const finished = useRef(false)
  const baseW = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.58, 280) : 260
  const [aspect, setAspect] = useState(1.05)
  const [path, setPath] = useState<{
    fromX: number
    fromY: number
    toX: number
    toY: number
    nearScale: number
    landScale: number
  } | null>(null)

  const baseH = baseW * aspect

  useEffect(() => {
    let cancelled = false
    const done = () => {
      if (cancelled || finished.current) return
      finished.current = true
      onDone()
    }

    const measure = () => {
      const slot = slotRef.current
      if (!slot) return
      const r = slot.getBoundingClientRect()
      if (r.width < 8 || r.height < 8) return
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      setPath((prev) => {
        if (prev) return prev
        return {
          fromX: cx - baseW / 2,
          fromY: cy - baseH / 2,
          toX: r.left + r.width / 2 - baseW / 2,
          toY: r.top + r.height / 2 - baseH / 2,
          nearScale: 2.35,
          landScale: r.width / baseW,
        }
      })
    }

    measure()
    const id = window.requestAnimationFrame(measure)
    const t = window.setTimeout(measure, 60)
    const t2 = window.setTimeout(measure, 180)
    // If slot never measures, still dismiss intro quickly
    const noPath = window.setTimeout(() => {
      setPath((prev) => {
        if (prev) return prev
        const cx = window.innerWidth / 2
        const cy = window.innerHeight / 2
        return {
          fromX: cx - baseW / 2,
          fromY: cy - baseH / 2,
          toX: cx - baseW / 2,
          toY: cy - baseH / 2,
          nearScale: 2.1,
          landScale: 0.55,
        }
      })
    }, 400)
    const failSafe = window.setTimeout(done, 3400)

    return () => {
      cancelled = true
      window.cancelAnimationFrame(id)
      window.clearTimeout(t)
      window.clearTimeout(t2)
      window.clearTimeout(noPath)
      window.clearTimeout(failSafe)
    }
    // intentionally omit baseH — avoid restarting timers when logo aspect loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotRef, baseW, onDone])

  return (
    <motion.div
      className="intro"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Soft dark stage (not harsh black) — fades to reveal the site */}
      <motion.div
        className="intro__stage-bg"
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 1, 0.7, 0.25, 0] }}
        transition={{ duration: 3.9, times: [0, 0.32, 0.5, 0.78, 1], ease: 'easeInOut' }}
      />
      <motion.div
        className="intro__glow"
        initial={{ opacity: 0.55, scale: 0.85 }}
        animate={{ opacity: [0.55, 0.7, 0.35, 0], scale: [0.85, 1.05, 1.2, 1.4] }}
        transition={{ duration: 3.9, times: [0, 0.35, 0.7, 1] }}
        aria-hidden="true"
      />

      {path ? (
        <motion.div
          className="intro__flyer"
          style={{
            width: baseW,
            transformOrigin: 'center center',
            transformStyle: 'preserve-3d',
          }}
          initial={{
            x: path.fromX,
            y: path.fromY,
            scale: path.nearScale,
            rotateX: 14,
            rotateY: -24,
            opacity: 0,
          }}
          animate={{
            x: [path.fromX, path.fromX, path.toX],
            y: [path.fromY, path.fromY, path.toY],
            scale: [path.nearScale, path.nearScale * 0.96, path.landScale],
            rotateX: [14, -8, 0],
            rotateY: [0, 360, 720],
            rotateZ: [0, 5, 0],
            opacity: [0, 1, 1],
          }}
          transition={{
            duration: 3.9,
            times: [0, 0.38, 1],
            ease: [0.22, 1, 0.36, 1],
            opacity: { duration: 0.45, times: [0, 0.12, 1] },
          }}
          onAnimationComplete={() => {
            if (finished.current) return
            finished.current = true
            onDone()
          }}
        >
          <img
            className="intro__logo"
            src={logoSrc}
            alt="Shalimar Fashions"
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget
              if (img.naturalWidth > 0) {
                setAspect(img.naturalHeight / img.naturalWidth)
              }
            }}
          />
        </motion.div>
      ) : null}
    </motion.div>
  )
}

function TypedBrand({ active, reduce }: { active: boolean; reduce: boolean }) {
  const fullMain = 'SHALIMAR'
  const fullSub = 'FASHIONS'
  const [main, setMain] = useState(reduce ? fullMain : '')
  const [sub, setSub] = useState(reduce ? fullSub : '')
  const [phase, setPhase] = useState<'main' | 'sub' | 'done'>(reduce ? 'done' : 'main')

  useEffect(() => {
    if (!active || reduce) {
      setMain(fullMain)
      setSub(fullSub)
      setPhase('done')
      return
    }

    setMain('')
    setSub('')
    setPhase('main')
    let i = 0
    const mainTimer = window.setInterval(() => {
      i += 1
      setMain(fullMain.slice(0, i))
      if (i >= fullMain.length) {
        window.clearInterval(mainTimer)
        setPhase('sub')
      }
    }, 70)

    return () => window.clearInterval(mainTimer)
  }, [active, reduce])

  useEffect(() => {
    if (!active || reduce || phase !== 'sub') return
    let j = 0
    const subTimer = window.setInterval(() => {
      j += 1
      setSub(fullSub.slice(0, j))
      if (j >= fullSub.length) {
        window.clearInterval(subTimer)
        setPhase('done')
      }
    }, 55)
    return () => window.clearInterval(subTimer)
  }, [phase, active, reduce])

  return (
    <h1 className="folio__brand" aria-label="Shalimar Fashions">
      <span className="folio__brand-main">
        {main}
        {phase === 'main' ? <span className="folio__caret" aria-hidden="true" /> : null}
      </span>
      <span className="folio__brand-sub">
        {sub}
        {phase === 'sub' ? <span className="folio__caret" aria-hidden="true" /> : null}
      </span>
    </h1>
  )
}

function Logo3D({
  src,
  alt,
  active,
  reduce,
  slotRef,
  visible,
}: {
  src: string
  alt: string
  active: boolean
  reduce: boolean
  slotRef: RefObject<HTMLDivElement | null>
  visible: boolean
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 140, damping: 16 })
  const sy = useSpring(my, { stiffness: 140, damping: 16 })
  const rx = useTransform(sy, [-0.5, 0.5], [12, -12])
  const ry = useTransform(sx, [-0.5, 0.5], [-16, 16])

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce || !stageRef.current) return
    const r = stageRef.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  return (
    <div
      className="folio__hero-mark"
      onPointerMove={onMove}
      onPointerLeave={() => {
        mx.set(0)
        my.set(0)
      }}
    >
      <span className="folio__logo-glow" aria-hidden="true" />
      <motion.div
        ref={(node) => {
          stageRef.current = node
          slotRef.current = node
        }}
        className="folio__logo-stage"
        style={
          reduce
            ? { opacity: visible ? 1 : 0 }
            : {
                rotateX: rx,
                rotateY: ry,
                transformStyle: 'preserve-3d',
                opacity: visible ? 1 : 0,
              }
        }
        initial={false}
        animate={
          !active || !visible
            ? { opacity: visible ? 1 : 0 }
            : reduce
              ? { opacity: 1, scale: 1 }
              : { opacity: 1, scale: [1, 1.06, 1] }
        }
        transition={
          reduce || !visible
            ? { duration: 0.2 }
            : {
                opacity: { duration: 0.2 },
                scale: { duration: 3.8, repeat: Infinity, ease: 'easeInOut' },
              }
        }
      >
        <img src={src} alt={alt} draggable={false} />
      </motion.div>
    </div>
  )
}

function IconSave() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5v11M12 14.5l-3.5-3.5M12 14.5l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 18.5h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18" cy="5.5" r="2.2" stroke="currentColor" strokeWidth="1.65" />
      <circle cx="6" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.65" />
      <circle cx="18" cy="18.5" r="2.2" stroke="currentColor" strokeWidth="1.65" />
      <path d="M8 11.1 16 6.4M8 12.9l8 4.7" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  )
}

function IconCall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.5 4.5h2.2l1.1 3.2-1.6 1.1a12.5 12.5 0 0 0 5 5l1.1-1.6 3.2 1.1v2.2a1.5 1.5 0 0 1-1.5 1.5A14.5 14.5 0 0 1 4 6a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconWa() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 3.2A8.8 8.8 0 0 0 3.3 11.94c0 1.55.4 3.06 1.17 4.4L3.2 20.8l4.58-1.2a8.78 8.78 0 0 0 4.26 1.1h.01a8.8 8.8 0 0 0 0-17.5Zm5.13 12.5c-.22.62-1.28 1.18-1.78 1.26-.46.07-1.03.1-1.66-.1-.38-.13-.87-.28-1.5-.55-2.64-1.14-4.36-3.8-4.49-3.98-.13-.17-1.06-1.41-1.06-2.69 0-1.28.67-1.91.91-2.17.24-.26.52-.32.7-.32h.5c.16 0 .37-.06.58.44.22.52.74 1.8.8 1.93.07.13.1.28.02.45-.08.17-.12.28-.24.43-.12.15-.25.33-.36.44-.12.12-.24.25-.1.49.13.24.6.99 1.29 1.6.89.8 1.64 1.05 1.88 1.17.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.16 1.2Z" />
    </svg>
  )
}

function IconIg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="igGrad" x1="3" y1="21" x2="21" y2="3">
          <stop stopColor="#f58529" />
          <stop offset="0.4" stopColor="#dd2a7b" />
          <stop offset="1" stopColor="#515bd4" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5.2" stroke="url(#igGrad)" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="4.1" stroke="url(#igGrad)" strokeWidth="1.75" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="#dd2a7b" />
    </svg>
  )
}

function IconFb() {
  return (
    <svg viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M14.1 8.4h2.4V5.6c-.35-.05-1.55-.15-2.95-.15-2.92 0-4.92 1.78-4.92 5.05V13H6.2v3.1h2.43V22h3.35v-5.9h2.72l.42-3.1h-3.14V11c0-.87.24-1.47 1.5-1.6Z" />
    </svg>
  )
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7.2A2.2 2.2 0 0 1 6.2 5h11.6A2.2 2.2 0 0 1 20 7.2v9.6a2.2 2.2 0 0 1-2.2 2.2H6.2A2.2 2.2 0 0 1 4 16.8V7.2Z"
        stroke="#8b6b4a"
        strokeWidth="1.7"
      />
      <path
        d="m5.2 7.4 6.2 4.4c.36.26.84.26 1.2 0l6.2-4.4"
        stroke="#8b6b4a"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconWeb() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.3" stroke="#5a7a6a" strokeWidth="1.7" />
      <path
        d="M3.7 12h16.6M12 3.7c2.5 2.65 3.8 5.45 3.8 8.3s-1.3 5.65-3.8 8.3c-2.5-2.65-3.8-5.45-3.8-8.3S9.5 6.35 12 3.7Z"
        stroke="#5a7a6a"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg className="folio__chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6.5 14.5 12 9 17.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
