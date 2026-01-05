export const APP_CONFIG = {
  name: "Eventu",
  description: "Plataforma de eventos y entretenimiento",
  version: "2.0.0",
  author: "Eventu Team",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api",
    timeout: 10000,
  },
} as const

export const ROUTES = {
  HOME: "/",
  EVENTS: "/eventos",
  LOGIN: "/login",
  REGISTER: "/registro",
  SELL_EVENT: "/vende-tu-evento",
  ADMIN: "/admin",
  ORGANIZER: "/organizer",
  CART: "/carrito",
  CHECKOUT: "/checkout",
  PROFILE: "/mi-cuenta",
} as const

export const EVENT_CATEGORIES = {
  MUSIC: "music",
  SPORTS: "sports",
  THEATER: "theater",
  BUSINESS: "business",
  FOOD: "food",
  ART: "art",
  CULTURE: "culture",
  DANCE: "dance",
} as const

export const USER_ROLES = {
  USER: "user",
  ORGANIZER: "organizer",
  ADMIN: "admin",
} as const
