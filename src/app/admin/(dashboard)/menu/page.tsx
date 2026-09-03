import { MenuEditor } from "@/components/admin/MenuEditor";
import { getAdminMenu } from "@/lib/menu";
import { isPosMenuSync } from "@/lib/pos/config";
import { getLastMenuSync } from "@/lib/pos/menu-sync";

export default async function AdminMenuPage() {
  let items: Awaited<ReturnType<typeof getAdminMenu>> = [];
  let lastSync: Awaited<ReturnType<typeof getLastMenuSync>> = null;
  try {
    [items, lastSync] = await Promise.all([getAdminMenu(), getLastMenuSync()]);
  } catch {
    items = [];
    lastSync = null;
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-black text-gray-800 dark:text-white">Menu</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
        Add or update dishes, photos, prices, categories, and ratings. Changes show on the public menu after save.
      </p>
      <MenuEditor items={items} posMode={isPosMenuSync()} lastSync={lastSync} />
    </div>
  );
}
