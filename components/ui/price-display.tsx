import { cn } from "@/lib/utils"

interface PriceDisplayProps {
  price: number
  currency?: string
  className?: string
}

export { PriceDisplay }
export default function PriceDisplay({ price, currency = "$", className }: PriceDisplayProps) {
  return (
    <span className={cn("font-semibold", className)}>
      {currency}
      {price.toLocaleString("es-CO")}
    </span>
  )
}
