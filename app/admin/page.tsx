import { AdminDrawForm } from "@/components/AdminDrawForm";
import { getDraws } from "@/lib/draws";

export default async function AdminPage() {
  const draws = await getDraws();
  const latest = draws[draws.length - 1];
  return (
    <main className="wrap">
      <section className="panel">
        <h1>관리자</h1>
        <p className="muted">새 추첨 회차를 직접 추가하거나, 자동 업데이트 API를 수동 실행합니다.</p>
        <div className="notice" style={{marginBottom:18}}>
          Supabase 연결 전에는 저장이 되지 않습니다. `.env.local`에 Supabase 값과 `ADMIN_SECRET`을 설정한 뒤 사용하세요.
        </div>
        <p><strong>현재 최신 회차:</strong> {latest?.draw_no}회 / {latest?.draw_date}</p>
        <AdminDrawForm latestNo={latest?.draw_no ?? 0} />
      </section>
    </main>
  );
}
