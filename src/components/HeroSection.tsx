import { useRef, type PointerEvent } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion'
import type { CardData } from '../data/cardStore'
import './HeroSection.css'

interface Props {
  data: CardData
  introDone: boolean
}

export default function HeroSection({ data, introDone }: Props) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 140, damping: 16 })
  const springY = useSpring(mouseY, { stiffness: 140, damping: 16 })
  const rotateX = useTransform(springY, [-0.5, 0.5], [16, -16])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-18, 18])

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const onLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const show = introDone || !!reduce
  const logo = data.logoUrl || '/brand/logo-hero-gold.png'

  return (
    <section className="hero">
      <div className="hero__glow-field" aria-hidden="true">
        <span className="hero__beam hero__beam--a" />
        <span className="hero__beam hero__beam--b" />
        <span className="hero__beam hero__beam--c" />
      </div>

      <motion.p
        className="hero__eyebrow"
        initial={{ opacity: 0, y: 10 }}
        animate={show ? { opacity: 1, y: 0 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        {data.accentNote}
      </motion.p>

      <div className="hero__logo-stage" onPointerMove={onMove} onPointerLeave={onLeave}>
        <motion.div
          className="hero__aura"
          aria-hidden="true"
          animate={
            reduce
              ? undefined
              : { scale: [1, 1.18, 1], opacity: [0.35, 0.8, 0.35] }
          }
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="hero__ring hero__ring--outer"
          aria-hidden="true"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="hero__ring hero__ring--inner"
          aria-hidden="true"
          animate={reduce ? undefined : { rotate: -360 }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />

        <motion.div
          ref={ref}
          className="hero__logo-wrap"
          style={
            reduce
              ? undefined
              : { rotateX, rotateY, transformStyle: 'preserve-3d' }
          }
          initial={reduce ? false : { opacity: 0, scale: 0.42, z: -80 }}
          animate={
            show
              ? reduce
                ? { opacity: 1, scale: 1 }
                : {
                    opacity: 1,
                    scale: [0.42, 1.18, 0.96, 1.06, 1],
                    rotateZ: [-10, 8, -4, 3, 0],
                    z: [-80, 60, -10, 30, 0],
                    y: [0, -8, 4, -6, 0],
                  }
              : { opacity: 0, scale: 0.42 }
          }
          transition={
            show
              ? {
                  duration: 2.1,
                  ease: [0.22, 1, 0.36, 1],
                  times: [0, 0.35, 0.55, 0.78, 1],
                }
              : { duration: 0.2 }
          }
        >
          <motion.div
            className="hero__logo-pulse"
            animate={
              reduce || !show
                ? undefined
                : {
                    scale: [1, 1.045, 0.985, 1.03, 1],
                    rotateZ: [0, 1.8, -1.6, 1.2, 0],
                    y: [0, -6, 2, -4, 0],
                  }
            }
            transition={{
              duration: 3.6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2.1,
            }}
          >
            <img
              className="hero__logo"
              src={logo}
              alt={data.brandName}
              width={720}
              height={405}
              decoding="async"
            />
          </motion.div>
          <div className="hero__logo-shadow" aria-hidden="true" />
        </motion.div>
      </div>

      <motion.p
        className="hero__tagline"
        initial={{ opacity: 0, y: 14 }}
        animate={show ? { opacity: 1, y: 0 } : { opacity: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
      >
        {data.tagline}
      </motion.p>
    </section>
  )
}
