import { CafeShell } from "@/components/layout/CafeShell";
import { CafeHeader } from "@/components/layout/CafeHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <CafeShell>
      <CafeHeader />
      <main className="px-4 py-8">
        <Card className="relative space-y-4 overflow-hidden">
          <h1 className="text-2xl font-black text-gray-800 dark:text-white">Staff login</h1>
          {error === "locked" ? (
            <p className="text-sm text-red-600">Too many attempts. Try again in 15 minutes.</p>
          ) : error ? (
            <p className="text-sm text-red-600">Password did not match.</p>
          ) : null}
          <form method="POST" action="/api/admin/login" className="space-y-3" autoComplete="off">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
            />
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Password
              <Input className="mt-1" type="password" name="password" required maxLength={256} autoComplete="current-password" />
            </label>
            <Button type="submit" className="w-full" size="lg">
              Enter dashboard
            </Button>
          </form>
        </Card>
      </main>
    </CafeShell>
  );
}
