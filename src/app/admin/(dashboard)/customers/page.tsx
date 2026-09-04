import { CustomersPanel } from "@/components/admin/CustomersPanel";
import { getCatalogCustomers } from "@/lib/admin-customers";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await getCatalogCustomers();

  return (
    <div>
      <h1 className="mb-2 text-3xl font-black text-gray-800 dark:text-white">Customers</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
        Guests who entered a mobile number on the QR menu. Use this list for offers, follow-ups, and WhatsApp.
      </p>
      <CustomersPanel customers={customers} />
    </div>
  );
}
