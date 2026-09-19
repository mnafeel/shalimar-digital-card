import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { CardData } from '../data/cardStore'
import './CinematicIntro.css'

interface Props {
  data: CardData
  onDone: () => void
}

export default function CinematicIntro({ data, onDone }: Props) {
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (reduce) {
      onDone()
      return
    }
    const startExit = window.setTimeout(() => setExiting(true), 2800)
    const finish = window.setTimeout(() => {
      setVisible(false)
      onDone()
    }, 3600)
    return () => {
      window.clearTimeout(startExit)
      window.clearTimeout(finish)
    }
  }, [onDone, reduce])

  if (!visible || reduce) return null

  return (
    <motion.div
      className="intro"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="intro__bars" aria-hidden="true">
        <motion.div
          className="intro__bar intro__bar--top"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: exiting ? 0 : 1 }}
          transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
        />
        <motion.div
          className="intro__bar intro__bar--bottom"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: exiting ? 0 : 1 }}
          transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
        />
      </div>

      <div className="intro__stage">
        <motion.div
          className="intro__bloom"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 0.7, 0.35], scale: [0.4, 1.35, 1.8] }}
          transition={{ duration: 2.6, ease: 'easeOut' }}
        />
        <motion.img
          className="intro__logo"
          src={data.logoUrl || '/brand/logo-hero-gold.png'}
          alt=""
          initial={{ opacity: 0, scale: 0.35, rotate: -12, filter: 'blur(12px)' }}
          animate={{
            opacity: 1,
            scale: [0.35, 1.16, 0.98, 1.05, 1],
            rotate: [-12, 6, -3, 2, 0],
            filter: ['blur(12px)', 'blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
          }}
          transition={{ duration: 2.15, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.p
          className="intro__title"
          initial={{ opacity: 0, letterSpacing: '0.5em', y: 20 }}
          animate={{ opacity: 1, letterSpacing: '0.28em', y: 0 }}
          transition={{ delay: 1.1, duration: 1.1 }}
        >
          {data.brandName}
        </motion.p>
      </div>
    </motion.div>
  )
}
