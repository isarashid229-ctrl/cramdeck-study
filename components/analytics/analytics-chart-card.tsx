"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type AnalyticsChartCardProps = {
  title: string;
  description?: string;
  type: "bar" | "line" | "pie";
  data: Record<string, unknown>[];
  dataKey: string;
  xKey?: string;
  colors?: string[];
};

const DEFAULT_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#22c55e", "#f97316", "#06b6d4"];

export function AnalyticsChartCard({
  title,
  description,
  type,
  data,
  dataKey,
  xKey = "name",
  colors = DEFAULT_COLORS,
}: AnalyticsChartCardProps) {
  return (
    <Card className="gradient-card">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey={xKey} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey={dataKey} fill={colors[0]} radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : type === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey={xKey} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            ) : (
              <PieChart>
                <Pie
                  data={data}
                  dataKey={dataKey}
                  nameKey={xKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
