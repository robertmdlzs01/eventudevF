"use client"

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const data = [
  { name: "Concierto Rock", asistentes: 1200, ingresos: 48000, satisfaccion: 4.8 },
  { name: "Festival Jazz", asistentes: 800, ingresos: 32000, satisfaccion: 4.6 },
  { name: "Teatro Clásico", asistentes: 300, ingresos: 15000, satisfaccion: 4.9 },
  { name: "Evento Deportivo", asistentes: 2000, ingresos: 60000, satisfaccion: 4.2 },
  { name: "Exposición Arte", asistentes: 500, ingresos: 12500, satisfaccion: 4.7 },
]

export function EventsPerformanceChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="name"
          className="text-muted-foreground text-xs"
          axisLine={false}
          tickLine={false}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis yAxisId="left" className="text-muted-foreground text-xs" axisLine={false} tickLine={false} />
        <YAxis
          yAxisId="right"
          orientation="right"
          className="text-muted-foreground text-xs"
          axisLine={false}
          tickLine={false}
          domain={[0, 5]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          formatter={(value: any, name?: string) => {
            if (name === "ingresos") return [`$${value.toLocaleString()}`, "Ingresos"]
            if (name === "satisfaccion") return [`${value}/5`, "Satisfacción"]
            return [value.toLocaleString(), "Asistentes"]
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="asistentes" fill="#3b82f6" name="Asistentes" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="left" dataKey="ingresos" fill="#10b981" name="Ingresos" radius={[4, 4, 0, 0]} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="satisfaccion"
          stroke="#f59e0b"
          strokeWidth={3}
          name="Satisfacción"
          dot={{ fill: "#f59e0b", strokeWidth: 2, r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
