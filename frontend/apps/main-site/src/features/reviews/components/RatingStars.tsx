import { useState } from "react"

interface RatingStarsProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: "sm" | "md" | "lg"
  ariaLabel?: string
}

const SIZE_MAP: Record<NonNullable<RatingStarsProps["size"]>, number> = {
  sm: 16,
  md: 22,
  lg: 28,
}

export function RatingStars({ value, onChange, readOnly = false, size = "md", ariaLabel }: RatingStarsProps) {
  const [hover, setHover] = useState<number | null>(null)
  const rendered = hover ?? value
  const fontSize = SIZE_MAP[size]

  const handleClick = (n: number) => {
    if (readOnly || !onChange) return
    onChange(n)
  }

  const handleHover = (n: number | null) => {
    if (readOnly || !onChange) return
    setHover(n)
  }

  return (
    <div
      role={readOnly ? "img" : "radiogroup"}
      aria-label={ariaLabel ?? `별점 ${value}점`}
      className="flex gap-4 items-center"
      style={{ fontSize }}
      onMouseLeave={() => handleHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = rendered >= n
        const base: React.CSSProperties = {
          cursor: readOnly ? "default" : "pointer",
          color: filled ? "var(--accent)" : "var(--border)",
          fontSize,
          lineHeight: 1,
          userSelect: "none",
        }
        if (readOnly) {
          return (
            <span key={n} style={base} aria-hidden>
              ★
            </span>
          )
        }
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}점`}
            onClick={() => handleClick(n)}
            onMouseEnter={() => handleHover(n)}
            onFocus={() => handleHover(n)}
            onBlur={() => handleHover(null)}
            style={{ ...base, background: "transparent", border: 0, padding: 0 }}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}
