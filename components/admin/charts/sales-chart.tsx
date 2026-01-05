"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { name: "Ene", ventas: 4000, eventos: 24 },
  { name: "Feb", ventas: 3000, eventos: 18 },
  { name: "Mar", ventas: 5000, eventos: 32 },
  { name: "Abr", ventas: 2780, eventos: 22 },
  { name: "May", ventas: 1890, eventos: 15 },
  { name: "Jun", ventas: 2390, eventos: 28 },
  { name: "Jul", ventas: 3490, eventos: 35 },
]

export function SalesChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" className="text-muted-foreground text-xs" axisLine={false} tickLine={false} />
        <YAxis className="text-muted-foreground text-xs" axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Area
          type="monotone"
          dataKey="ventas"
          stroke="hsl(var(--primary))"
          fillOpacity={1}
          fill="url(#colorVentas)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
