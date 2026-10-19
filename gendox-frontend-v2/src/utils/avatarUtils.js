// Up to two initials: "Support Assistant" → "SA", "giannis" → "GI"
export const getInitials = name => {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()

  return (words[0][0] + words[1][0]).toUpperCase()
}

// A stable hue (0-359) for an id or a name, so an avatar keeps its colour everywhere
export const getHue = value => {
  const seed = String(value ?? '')
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360
  }

  return hash
}
