import { OrderMenu } from "@/components/order/OrderMenu";
import { getLiveMenu } from "@/lib/menu";
import { isOrderingEnabled } from "@/lib/pos/config";

export default async function TableOrderPage({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  const tableNumber = Number.parseInt(table, 10);
  const dishes = await getLiveMenu();
  return (
    <OrderMenu
      tableNumber={Number.isFinite(tableNumber) ? tableNumber : 0}
      dishes={dishes}
      orderingEnabled={isOrderingEnabled()}
    />
  );
}
