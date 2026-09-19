import './AmbientBackground.css'

export default function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient__orb ambient__orb--a" />
      <div className="ambient__orb ambient__orb--b" />
      <div className="ambient__orb ambient__orb--c" />
      <div className="ambient__mesh" />
      <div className="ambient__grain" />
      <div className="ambient__vignette" />
    </div>
  )
}
