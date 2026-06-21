export default function Aurora({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="aurora-bg">
        <div className="aurora-mid" />
      </div>
      <svg className="fixed inset-0 -z-10 opacity-[0.025] pointer-events-none" width="100%" height="100%">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
      {children}
    </div>
  );
}
