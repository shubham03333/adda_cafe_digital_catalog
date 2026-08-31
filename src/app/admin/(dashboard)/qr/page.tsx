import { QrGrid } from "@/components/admin/QrGrid";
import { getSettings } from "@/lib/admin-stats";

export default async function AdminQrPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-3xl font-black text-gray-800 dark:text-white">Table QR codes</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Print these for each table. Scanning opens the review assistant, then guests can open the menu.
      </p>
      <QrGrid tableCount={settings.table_count} />
    </div>
  );
}
