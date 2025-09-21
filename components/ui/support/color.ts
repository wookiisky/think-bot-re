export interface RgbColor {
  r: number
  g: number
  b: number
}

const clampChannel = (value: number) => {
  return Math.min(255, Math.max(0, Math.round(value)))
}

const parseHex = (value: string): RgbColor | null => {
  const normalized = value.trim().replace(/^#/, "")
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16)
    const g = parseInt(normalized[1] + normalized[1], 16)
    const b = parseInt(normalized[2] + normalized[2], 16)
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return null
    }
    return { r, g, b }
  }

  if (normalized.length === 6 || normalized.length === 8) {
    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return null
    }
    return { r, g, b }
  }

  return null
}

const parseRgb = (value: string): RgbColor | null => {
  const match = value.trim().match(/^rgba?\(([^)]+)\)$/i)
  if (!match) {
    return null
  }

  const parts = match[1]
    .split(",")
    .map((token) => token.trim())
    .slice(0, 3)

  if (parts.length !== 3) {
    return null
  }

  const [rValue, gValue, bValue] = parts
  const r = Number.parseFloat(rValue)
  const g = Number.parseFloat(gValue)
  const b = Number.parseFloat(bValue)

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return null
  }

  return {
    r: clampChannel(r),
    g: clampChannel(g),
    b: clampChannel(b)
  }
}

const parseColor = (value: string): RgbColor | null => {
  if (!value) {
    return null
  }

  return parseHex(value) ?? parseRgb(value)
}

const applyToChannels = (
  color: string,
  transform: (channel: number) => number
): string => {
  const rgb = parseColor(color)
  if (!rgb) {
    return color
  }

  const r = clampChannel(transform(rgb.r))
  const g = clampChannel(transform(rgb.g))
  const b = clampChannel(transform(rgb.b))

  return `rgb(${r}, ${g}, ${b})`
}

export const withAlpha = (color: string, alpha: number) => {
  const rgb = parseColor(color)
  if (!rgb) {
    return color
  }

  const safeAlpha = Math.min(1, Math.max(0, alpha))
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${safeAlpha})`
}

export const lighten = (color: string, amount: number) => {
  const safeAmount = Math.min(1, Math.max(0, amount))
  return applyToChannels(color, (channel) => channel + (255 - channel) * safeAmount)
}

export const darken = (color: string, amount: number) => {
  const safeAmount = Math.min(1, Math.max(0, amount))
  return applyToChannels(color, (channel) => channel * (1 - safeAmount))
}

const channelToLinear = (channel: number) => {
  const normalized = channel / 255
  if (normalized <= 0.03928) {
    return normalized / 12.92
  }
  return ((normalized + 0.055) / 1.055) ** 2.4
}

const luminance = (color: string) => {
  const rgb = parseColor(color)
  if (!rgb) {
    return 0
  }

  const r = channelToLinear(rgb.r)
  const g = channelToLinear(rgb.g)
  const b = channelToLinear(rgb.b)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const readableTextColor = (
  background: string,
  lightFallback = "#ffffff",
  darkFallback = "#0c111d"
) => {
  const value = luminance(background)
  if (value === 0) {
    return lightFallback
  }

  return value > 0.5 ? darkFallback : lightFallback
}
