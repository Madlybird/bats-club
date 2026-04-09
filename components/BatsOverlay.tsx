const BAT_ANIMS = ["bat-wave-left", "bat-wave-right", "bat-wave-slight"] as const

const BATS = Array.from({ length: 140 }, (_, i) => ({
  x: (i * 37 + 5) % 95,
  y: (i * 41 + 8) % 98,
  duration: (9 + ((i * 1.3) % 9)) / 2,
  delay: (i * 0.65) % 9,
  anim: BAT_ANIMS[i % 3],
}))

export default function BatsOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      {BATS.map((b, i) => (
        <img
          key={i}
          src="/bat.png"
          alt=""
          width={56}
          height={56}
          className={i >= 5 ? "hidden md:block" : undefined}
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: 56,
            height: 56,
            opacity: 0,
            animation: `${b.anim} ${b.duration}s ease-in-out ${b.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
