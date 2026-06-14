import { AdminPanelClient } from "@/components/AdminPanelClient";
import { getLatestDraw } from "@/lib/draws";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminPage() {
  const latest = await getLatestDraw();

  return (
    <main className="container">
      <AdminPanelClient latestNo={latest?.draw_no ?? 0} />
    </main>
  );
}
