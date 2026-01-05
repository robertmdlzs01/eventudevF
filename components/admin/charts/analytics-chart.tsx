"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const data = [
  { name: "1 Jul", usuarios: 120, ventas: 85, conversion: 24 },
  { name: "5 Jul", usuarios: 150, ventas: 95, conversion: 28 },
  { name: "10 Jul", usuarios: 180, ventas: 110, conversion: 32 },
  { name: "15 Jul", usuarios: 200, ventas: 125, conversion: 35 },
  { name: "20 Jul", usuarios: 170, ventas: 105, conversion: 30 },
  { name: "25 Jul", usuarios: 220, ventas: 140, conversion: 38 },
  { name: "30 Jul", usuarios: 250, ventas: 160, conversion: 42 },
]

export function AnalyticsChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="usuarios"
          stroke="#3b82f6"
          strokeWidth={3}
          name="Usuarios"
          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="ventas"
          stroke="#10b981"
          strokeWidth={3}
          name="Ventas"
          dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="conversion"
          stroke="#f59e0b"
          strokeWidth={3}
          name="Conversión %"
          dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "#f59e0b", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
