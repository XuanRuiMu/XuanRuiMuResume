export function SkillGalaxyFallback() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
      data-testid="skill-galaxy-fallback"
    >
      <div className="skill-galaxy-aurora absolute inset-0 opacity-60" />
      <div className="skill-galaxy-stars absolute inset-0" />
      <div className="skill-galaxy-constellation absolute inset-0" />
    </div>
  )
}
