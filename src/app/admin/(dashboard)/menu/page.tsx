import { MenuEditor } from "@/components/admin/MenuEditor";
import { getAdminMenu } from "@/lib/menu";

export default async function AdminMenuPage() {
  const items = await getAdminMenu();

  return (
    <div>
      <h1 className="mb-2 text-3xl font-black text-gray-800 dark:text-white">Menu</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
        Add or update dishes, photos, prices, categories, and ratings. Changes show on the public menu after save.
      </p>
      <MenuEditor items={items} />
    </div>
  );
}
