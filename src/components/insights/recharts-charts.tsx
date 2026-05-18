'use client'

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'

interface RechartsChartsProps {
  engagementData: Array<{ date: string; reach: number; likes: number; comments: number; shares: number; saves: number }>
  pillarData: Array<{ name: string; value: number; color: string }>
  topPosts: Array<{ title: string; type: string; likes: number; comments: number; reach: number; engagement: number }>
  showPieOnly?: boolean
}

const barData = [
  { type: 'Posts', engagement: 4.2, count: 12 },
  { type: 'Reels', engagement: 5.1, count: 8 },
  { type: 'Stories', engagement: 3.8, count: 15 },
  { type: 'Carousel', engagement: 4.7, count: 6 },
]

export default function RechartsCharts({ engagementData, pillarData, topPosts, showPieOnly }: RechartsChartsProps) {
  const tooltipStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }

  if (showPieOnly) {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={pillarData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
            {pillarData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">Engagement semanal</h3>
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={250} minWidth={300}>
              <AreaChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="reach" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} name="Alcance" />
                <Area type="monotone" dataKey="likes" stroke="#EC4899" fill="#EC4899" fillOpacity={0.1} name="Likes" />
                <Area type="monotone" dataKey="comments" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} name="Comments" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">Distribución por tipo</h3>
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={250} minWidth={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="engagement" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Engagement %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  )
}