"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export function EventTypeChart({
  data,
}: {
  data: { type: string; count: number }[];
}) {
  if (data.length === 0)
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No events yet
      </p>
    );
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="type"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {data.map((entry, i) => (
            <Cell key={entry.type} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ProjectViewsChart({
  data,
}: {
  data: { projectName: string; views: number; uniqueVisitors: number }[];
}) {
  if (data.length === 0)
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No views yet
      </p>
    );
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis
          dataKey="projectName"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="uniqueVisitors" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
