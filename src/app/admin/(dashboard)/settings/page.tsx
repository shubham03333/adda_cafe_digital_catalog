import { saveSettings } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSettings } from "@/lib/admin-stats";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const settings = await getSettings();
  const params = await searchParams;

  return (
    <div className="max-w-xl pb-16">
      <h1 className="mb-4 text-3xl font-black text-gray-800 dark:text-white">Cafe settings</h1>
      <Card>
        {params.saved ? <p className="mb-3 text-sm text-emerald-700">Saved.</p> : null}
        {params.error ? (
          <p className="mb-3 text-sm text-red-600">Could not save. Check the Google URL and Supabase keys.</p>
        ) : null}
        <form action={saveSettings} className="space-y-4">
          <label className="block text-sm font-semibold">
            Cafe name
            <Input className="mt-1" name="cafe_name" defaultValue={settings.cafe_name} required />
          </label>
          <label className="block text-sm font-semibold">
            Google Review URL
            <Input
              className="mt-1"
              name="google_review_url"
              defaultValue={settings.google_review_url}
              placeholder="https://search.google.com/local/writereview?placeid=..."
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            Number of tables
            <Input className="mt-1" type="number" min={1} max={200} name="table_count" defaultValue={settings.table_count} />
          </label>
          <label className="block text-sm font-semibold">
            Table map (catalog number → POS table_code)
            <Input
              className="mt-1"
              name="table_map"
              defaultValue={JSON.stringify(settings.table_map ?? {})}
              placeholder='{"1":"T01","5":"T05","12":"T12"}'
            />
          </label>
          <Button type="submit">Save settings</Button>
        </form>
      </Card>
    </div>
  );
}
