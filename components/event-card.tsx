import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin } from "lucide-react"

interface EventCardProps {
  title: string
  image: string
  date: string
  location: string
  category: string
  slug?: string
  featured?: boolean
  rating?: number
}

export default function EventCard({
  title,
  image,
  date,
  location,
  category,
  slug = "#",
  featured = false,
  rating,
}: EventCardProps) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-primary-200 transform hover:-translate-y-2">
      <Link href={`/evento/${slug}`}>
        <div className="relative h-56 overflow-hidden">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          
          {/* Badge de categoría */}
          <div className="absolute top-4 left-4">
            <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              {category}
            </span>
          </div>
          
          {/* Badge destacado */}
          {featured && (
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                Destacado
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-6">
        <Link href={`/evento/${slug}`}>
          <h3 className="font-bold text-xl mb-4 group-hover:text-primary-600 transition-colors line-clamp-2 text-gray-800 leading-tight">
            {title}
          </h3>
        </Link>

        <div className="space-y-3 text-sm text-gray-600 mb-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-primary-50 mr-3 group-hover:bg-primary-100 transition-colors">
              <Calendar className="h-4 w-4 text-primary-600" />
            </div>
            <span className="font-medium text-gray-700">{date}</span>
          </div>
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-secondary-50 mr-3 group-hover:bg-secondary-100 transition-colors">
              <MapPin className="h-4 w-4 text-secondary-600" />
            </div>
            <span className="font-medium text-gray-700">{location}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <Link
            href={`/evento/${slug}`}
            className="inline-flex items-center justify-center w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group/link"
          >
            Ver detalles
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-2 group-hover/link:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
