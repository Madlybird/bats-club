"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"

interface SliderFigure {
  id: string
  name: string
  series: string
  imageUrl?: string | null
}

interface Props {
  title: string
  figures: SliderFigure[]
  figurePath: string
  fallbackImages: string[]
}

export default function CollectionSlider({
  title,
  figures,
  figurePath,
  fallbackImages,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" })
  }

  if (!figures.length) return null

  return (
    <div className="mb-14 last:mb-0">
      <div className="flex items-end justify-between mb-5 gap-4">
        <h3
          className="font-black lowercase leading-tight tracking-tighter text-white"
          style={{ fontSize: "clamp(1.25rem, 3vw, 2rem)" }}
        >
          {title}
        </h3>
        <div className="hidden sm:flex gap-2 flex-shrink-0">
          <button
            type="button"
            aria-label="previous"
            onClick={() => scrollBy(-1)}
            className="w-9 h-9 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-[#ff2d78]/50 transition-colors flex items-center justify-center"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="next"
            onClick={() => scrollBy(1)}
            className="w-9 h-9 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-[#ff2d78]/50 transition-colors flex items-center justify-center"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {figures.map((fig, i) => (
          <Link
            key={fig.id}
            href={`${figurePath}/${fig.id}`}
            className="group snap-start flex-shrink-0 w-[53vw] sm:w-[264px]"
          >
            <div className="figure-grid-item relative aspect-square overflow-hidden rounded-xl">
              <Image
                src={fig.imageUrl || fallbackImages[i % fallbackImages.length]}
                alt={fig.name}
                fill
                unoptimized
                className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 53vw, 264px"
              />
            </div>
            <p className="mt-3 text-sm font-bold text-white group-hover:text-[#ff2d78] transition-colors lowercase leading-tight line-clamp-1">
              {fig.name}
            </p>
            <p className="text-xs text-white/25 mt-0.5 line-clamp-1">{fig.series}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
