export function getAssetUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path
  return `/${cleanPath}`
}

export function getPlaceholderUrl(options: {
  width?: number
  height?: number
  text?: string
  bg?: string
  color?: string
}): string {
  const params = new URLSearchParams()

  if (options.width) params.set("width", options.width.toString())
  if (options.height) params.set("height", options.height.toString())
  if (options.text) params.set("text", options.text)
  if (options.bg) params.set("bg", options.bg)
  if (options.color) params.set("color", options.color)

  return `/placeholder.svg`
}

export const ASSET_PATHS = {
  LOGO: "images/eventu-logo.svg",
  ICON: "images/eventu-icono.png",
  PANACA_POSTER: "images/panaca-poster.jpg",
  SEAT_MAP_DESKTOP: "images/seat-map-desktop.webp",
  SEAT_MAP_MOBILE: "images/seat-map-mobile.webp",
  PLACEHOLDER_LOGO: "placeholders/placeholder-logo.svg",
  PLACEHOLDER_USER: "placeholders/placeholder-user.jpg",
  PLACEHOLDER: "placeholders/placeholder.svg",
} as const
