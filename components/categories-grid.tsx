"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Drama, Trophy, Presentation, Calendar, Users } from "lucide-react"

interface Category {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  color: string
  event_count?: number
}

interface CategoriesGridProps {
  categories?: Category[]
  onCategorySelect?: (category: Category) => void
}

const iconMap = {
  music: Music,
  drama: Drama,
  trophy: Trophy,
  presentation: Presentation,
  calendar: Calendar,
  users: Users,
}

const defaultCategories: Category[] = [
  {
    id: 1,
    name: "Música",
    slug: "musica",
    description: "Conciertos, festivales y eventos musicales",
    icon: "music",
    color: "#E11D48",
    event_count: 12,
  },
  {
    id: 2,
    name: "Teatro",
    slug: "teatro",
    description: "Obras de teatro, musicales y espectáculos",
    icon: "drama",
    color: "#7C3AED",
    event_count: 8,
  },
  {
    id: 3,
    name: "Deportes",
    slug: "deportes",
    description: "Eventos deportivos y competencias",
    icon: "trophy",
    color: "#059669",
    event_count: 15,
  },
  {
    id: 4,
    name: "Conferencias",
    slug: "conferencias",
    description: "Conferencias, seminarios y eventos corporativos",
    icon: "presentation",
    color: "#DC2626",
    event_count: 6,
  },
  {
    id: 5,
    name: "Festivales",
    slug: "festivales",
    description: "Festivales culturales y gastronómicos",
    icon: "calendar",
    color: "#D97706",
    event_count: 4,
  },
  {
    id: 6,
    name: "Familiar",
    slug: "familiar",
    description: "Eventos para toda la familia",
    icon: "users",
    color: "#2563EB",
    event_count: 9,
  },
]

export default function CategoriesGrid({ categories = defaultCategories, onCategorySelect }: CategoriesGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category.slug)
    onCategorySelect?.(category)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((category) => {
        const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Music
        const isSelected = selectedCategory === category.slug

        return (
          <Card
            key={category.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              isSelected ? "ring-2 ring-primary shadow-lg" : ""
            }`}
            onClick={() => handleCategoryClick(category)}
          >
            <CardContent className="p-4 text-center">
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <IconComponent className="w-6 h-6" style={{ color: category.color }} />
              </div>
              <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
              {category.event_count !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  {category.event_count} eventos
                </Badge>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
