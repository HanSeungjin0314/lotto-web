import { AdminDrawForm } from "@/components/AdminDrawForm";
import { UpdateLogList } from "@/components/UpdateLogList";
import { getLatestDraw } from "@/lib/draws";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminPage() {
  const latest = await getLatestDraw();

  return (
    <main className="container">
      <section className="panel">
        <h1>관리자</h1>
        <p className="muted">
          실제 로또 당첨번호만 입력하세요. 일반 사용자 메뉴에서는 숨겨진 페이지입니다.
        </p>

        <AdminDrawForm latestNo={latest?.draw_no ?? 0} />
      </section>

      <section className="panel">
        <h2>업데이트 로그</h2>
        <p className="muted">
          Cron 자동 업데이트 실행 결과를 확인합니다.
        </p>

        <UpdateLogList />
      </section>
    </main>
  );
}