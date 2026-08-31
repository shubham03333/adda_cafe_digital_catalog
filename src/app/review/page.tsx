import { ReviewFlow } from "@/components/review/ReviewFlow";
import { getLiveMenu } from "@/lib/menu";

export default async function ReviewPage() {
  const dishes = await getLiveMenu();
  return <ReviewFlow dishes={dishes} />;
}
