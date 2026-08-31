import { MenuPage } from "@/components/menu/MenuPage";
import { getLiveMenu } from "@/lib/menu";

export default async function DigitalMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  const { table } = await searchParams;
  const tableNumber = table ? Number.parseInt(table, 10) : NaN;
  const dishes = await getLiveMenu();
  return (
    <MenuPage
      tableNumber={Number.isFinite(tableNumber) ? tableNumber : null}
      dishes={dishes}
    />
  );
}
