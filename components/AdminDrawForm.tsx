"use client";

import { useState } from "react";

export function AdminDrawForm({ latestNo }: { latestNo: number }) {
  const [secret, setSecret] = useState("");
  const [form, setForm] = useState({
    draw_no: String(latestNo + 1),
    draw_date: new Date().toISOString().slice(0, 10),
    n1: "", n2: "", n3: "", n4: "", n5: "", n6: "", bonus: "",
    first_prize_amount: "", first_winner_count: "",
  });
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);

  function patch(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    setMessage("");
    setKind("");
    try {
      const payload = {
        draw_no: Number(form.draw_no),
        draw_date: form.draw_date,
        numbers: [form.n1, form.n2, form.n3, form.n4, form.n5, form.n6].map(Number).sort((a, b) => a - b),
        bonus: form.bonus ? Number(form.bonus) : null,
        first_prize_amount: form.first_prize_amount || null,
        first_winner_count: form.first_winner_count ? Number(form.first_winner_count) : null,
      };
      const res = await fetch("/api/admin/draws", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "저장에 실패했습니다.");
      setKind("success");
      setMessage(`${json.draw.draw_no}회차가 저장되었습니다.`);
    } catch (e) {
      setKind("error");
      setMessage(e instanceof Error ? e.message : "알 수 없는 오류입니다.");
    } finally {
      setLoading(false);
    }
  }

  async function updateLatest() {
    setLoading(true);
    setMessage("");
    setKind("");
    try {
      const res = await fetch("/api/update-latest", { headers: { "x-cron-secret": secret } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "자동 업데이트에 실패했습니다.");
      setKind("success");
      setMessage(json.message || "자동 업데이트를 완료했습니다.");
    } catch (e) {
      setKind("error");
      setMessage(e instanceof Error ? e.message : "알 수 없는 오류입니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="form-grid" style={{marginBottom:16}}>
        <label style={{gridColumn:"1 / -1"}}>관리자 토큰<input type="password" value={secret} onChange={(e)=>setSecret(e.target.value)} placeholder="ADMIN_SECRET 또는 CRON_SECRET" /></label>
        <label>회차<input value={form.draw_no} onChange={(e)=>patch("draw_no", e.target.value)} /></label>
        <label>추첨일<input type="date" value={form.draw_date} onChange={(e)=>patch("draw_date", e.target.value)} /></label>
        {["n1","n2","n3","n4","n5","n6"].map((key, idx)=>(
          <label key={key}>번호{idx+1}<input value={(form as any)[key]} onChange={(e)=>patch(key, e.target.value)} placeholder="1~45" /></label>
        ))}
        <label>보너스<input value={form.bonus} onChange={(e)=>patch("bonus", e.target.value)} placeholder="1~45" /></label>
        <label>1등 당첨금액<input value={form.first_prize_amount} onChange={(e)=>patch("first_prize_amount", e.target.value)} placeholder="선택" /></label>
        <label>1등 당첨자 수<input value={form.first_winner_count} onChange={(e)=>patch("first_winner_count", e.target.value)} placeholder="선택" /></label>
      </div>
      <div className="controls">
        <button onClick={submit} disabled={loading}>{loading ? "처리 중..." : "회차 저장"}</button>
        <button className="secondary" onClick={updateLatest} disabled={loading}>최신 회차 자동 확인</button>
      </div>
      {message ? <p className={kind}>{message}</p> : null}
    </div>
  );
}
