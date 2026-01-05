"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const data = [
  { name: "Lun", ingresos: 12000, gastos: 8000 },
  { name: "Mar", ingresos: 19000, gastos: 6000 },
  { name: "Mié", ingresos: 15000, gastos: 7000 },
  { name: "Jue", ingresos: 25000, gastos: 9000 },
  { name: "Vie", ingresos: 22000, gastos: 8500 },
  { name: "Sáb", ingresos: 35000, gastos: 12000 },
  { name: "Dom", ingresos: 28000, gastos: 10000 },
]

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
          formatter={(value: any) => [`$${value.toLocaleString()}`, ""]}
        />
        <Legend />
        <Bar dataKey="ingresos" fill="hsl(var(--primary))" name="Ingresos" radius={[4, 4, 0, 0]} />
        <Bar dataKey="gastos" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
