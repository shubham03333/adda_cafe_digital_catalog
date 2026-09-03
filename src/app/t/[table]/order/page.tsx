import { OrderMenu } from "@/components/order/OrderMenu";
import { getLiveMenu } from "@/lib/menu";
import { isExtraCategory } from "@/lib/order-display";
import { isOrderingEnabled } from "@/lib/pos/config";

export default async function TableOrderPage({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  const tableNumber = Number.parseInt(table, 10);
  const dishes = await getLiveMenu();
  const preload = Array.from(
    new Set(
      dishes
        .filter((dish) => !isExtraCategory(dish.category) && dish.image && !dish.image.startsWith("/"))
        .slice(0, 8)
        .map((dish) => dish.image)
    )
  );

  return (
    <>
      {preload.map((href) => (
        <link key={href} rel="preload" as="image" href={href} fetchPriority="high" />
      ))}
      <OrderMenu
        tableNumber={Number.isFinite(tableNumber) ? tableNumber : 0}
        dishes={dishes}
        orderingEnabled={isOrderingEnabled()}
      />
    </>
  );
}
