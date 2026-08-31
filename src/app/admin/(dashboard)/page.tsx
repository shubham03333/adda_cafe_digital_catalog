import { Card } from "@/components/ui/card";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { getDashboardStats } from "@/lib/admin-stats";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-gray-800 dark:text-white">{value}</p>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6 pb-16">
      <h1 className="text-3xl font-black text-gray-800 dark:text-white">Today</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Today's visitors" value={stats.todayVisitors} />
        <Stat label="Average rating" value={stats.averageRating || "—"} />
        <Stat label="Feedback received" value={stats.feedbackCount} />
        <Stat label="Reviews generated" value={stats.generationCount} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Positive ratings" value={stats.positiveRatings} />
        <Stat label="Private / 1–3 stars" value={stats.negativeRatings} />
        <Stat label="Copy clicks (7d)" value={stats.funnel.copies} />
        <Stat label="Google clicks (7d)" value={stats.funnel.googleClicks} />
      </div>
      <DashboardCharts stats={stats} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-black text-gray-800 dark:text-white">Top ordered items</h2>
          {stats.topItems.length === 0 ? (
            <p className="text-sm text-gray-500">No selections yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.topItems.map((item) => (
                <li key={item.name} className="flex justify-between text-sm font-medium">
                  <span>{item.name}</span>
                  <span className="text-red-700">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-black text-gray-800 dark:text-white">Most selected review</h2>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            {stats.mostSelectedReview ?? "No review has been used yet."}
          </p>
        </Card>
      </div>
    </div>
  );
}
