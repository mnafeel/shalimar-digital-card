import type { CardData } from '../data/cardStore'
import Reveal from './Reveal'
import './AboutSection.css'

interface Props {
  data: CardData
}

export default function AboutSection({ data }: Props) {
  return (
    <Reveal>
      <section className="about">
        <div className="section-head">
          <p className="section-kicker">About</p>
          <h2>The House of Style</h2>
        </div>
        <p className="about__text">{data.about}</p>
        <div className="about__chips">
          <span>{data.designation}</span>
          <span>{data.address}</span>
        </div>
      </section>
    </Reveal>
  )
}
