"use client"
import { useState } from "react"
import Image from "next/image"

interface Props {
  images: string[]
  alt: string
  sizes?: string
  priority?: boolean
}

export default function PhotoCarousel({ images, alt, sizes = "(max-width: 1024px) 100vw, 50vw", priority }: Props) {
  const [current, setCurrent] = useState(0)

  if (images.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-8xl mb-4">🦇</span>
        <p className="text-white/30">No photos available</p>
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <Image
        src={images[0]}
        alt={alt}
        fill
        className="object-cover object-top"
        sizes={sizes}
        priority={priority}
      />
    )
  }

  return (
    <>
      <Image
        src={images[current]}
        alt={`${alt} — photo ${current + 1}`}
        fill
        className="object-cover object-top transition-opacity duration-300"
        sizes={sizes}
        priority={priority && current === 0}
      />

      {/* Prev arrow */}
      <button
        onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-white text-xl hover:bg-black/90 transition-colors"
        aria-label="Previous photo"
      >
        ‹
      </button>

      {/* Next arrow */}
      <button
        onClick={() => setCurrent((c) => (c + 1) % images.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-white text-xl hover:bg-black/90 transition-colors"
        aria-label="Next photo"
      >
        ›
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-200 ${
              i === current ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Photo ${i + 1}`}
          />
        ))}
      </div>
    </>
  )
}
