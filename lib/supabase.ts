import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos para TypeScript
export interface User {
  id: number
  email: string
  password: string
  first_name: string
  last_name: string
  role: string
  status: string
  created_at: string
}

export interface Category {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface Event {
  id: number
  title: string
  slug: string
  description: string | null
  date: string
  time: string
  venue: string
  location: string
  category_id: number | null
  organizer_id: number | null
  total_capacity: number
  sold: number
  price: number
  status: string
  featured: boolean
  image_url: string | null
  created_at: string
}
