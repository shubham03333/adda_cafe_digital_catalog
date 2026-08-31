import { ReviewFlow } from "@/components/review/ReviewFlow";
import { getLiveMenu } from "@/lib/menu";

export default async function TableLandingPage({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  const tableNumber = Number.parseInt(table, 10);
  const dishes = await getLiveMenu();
  return (
    <ReviewFlow
      tableNumber={Number.isFinite(tableNumber) ? tableNumber : null}
      dishes={dishes}
    />
  );
}
