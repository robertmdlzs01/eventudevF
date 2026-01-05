import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin } from "lucide-react"

interface FeaturedEventProps {
  title: string
  image: string
  date: string
  location: string
  description: string
  slug: string
}

export default function FeaturedEvent({ title, image, date, location, description, slug }: FeaturedEventProps) {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-xl overflow-hidden shadow-lg">
      <Image src={image || "/placeholder.svg"} alt={title} fill className="object-cover object-center" priority />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white w-full md:w-2/3 lg:w-1/2">
        <h2 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{title}</h2>
        <p className="text-lg md:text-xl mb-4 line-clamp-2">{description}</p>
        <div className="flex items-center space-x-4 text-sm md:text-base mb-6">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{date}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{location}</span>
          </div>
        </div>
        <Link href={`/evento/${slug}`}>
          <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105">
            Ver Detalles
          </Button>
        </Link>
      </div>
    </div>
  )
}
