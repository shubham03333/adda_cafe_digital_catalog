"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/admin-stats";

export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const funnelData = [
    { name: "QR scans", value: stats.funnel.qrScans },
    { name: "Ratings", value: stats.funnel.ratings },
    { name: "Copies", value: stats.funnel.copies },
    { name: "Google clicks", value: stats.funnel.googleClicks },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="mb-4 text-lg font-black text-gray-800 dark:text-white">Daily activity</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="scans" stroke="#dc2626" fill="#fecaca" name="QR scans" />
              <Area type="monotone" dataKey="copies" stroke="#f59e0b" fill="#fde68a" name="Copies" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <h3 className="mb-4 text-lg font-black text-gray-800 dark:text-white">Conversion funnel</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#dc2626" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
