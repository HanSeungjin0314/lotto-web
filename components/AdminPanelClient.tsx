"use client";

import { useEffect, useState } from "react";
import { AdminDrawForm } from "@/components/AdminDrawForm";
import { UpdateLogList } from "@/components/UpdateLogList";

const STORAGE_KEY = "lotto_admin_secret";

type AdminPanelClientProps = {
  latestNo: number;
};

export function AdminPanelClient({ latestNo }: AdminPanelClientProps) {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);

    if (saved) {
      setSecret(saved);
    }
  }, []);

  async function unlockAdmin() {
    setLoading(true);
    setMessage("");
    setKind("");

    try {
      const res = await fetch("/api/admin/draws", {
        method: "GET",
        headers: {
          "x-admin-secret": secret,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "관리자 인증에 실패했습니다.");
      }

      window.sessionStorage.setItem(STORAGE_KEY, secret);
      setUnlocked(true);
      setKind("success");
      setMessage("관리자 인증이 완료되었습니다.");
      setRefreshKey((value) => value + 1);
    } catch (error) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      setUnlocked(false);
      setKind("error");
      setMessage(error instanceof Error ? error.message : "알 수 없는 오류입니다.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setSecret("");
    setUnlocked(false);
    setMessage("");
    setKind("");
    setRefreshKey((value) => value + 1);
  }

  if (!unlocked) {
    return (
      <section className="panel">
        <h1>관리자</h1>
        <p className="muted">
          관리자 인증 후 회차 저장, 최신 회차 자동 확인, 업데이트 로그 조회를 사용할 수 있습니다.
        </p>

        <div className="form-grid" style={{ marginBottom: 16 }}>
          <label style={{ gridColumn: "1 / -1" }}>
            관리자 비밀번호
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="ADMIN_SECRET 입력"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  unlockAdmin();
                }
              }}
            />
          </label>
        </div>

        <div className="controls">
          <button onClick={unlockAdmin} disabled={loading || !secret}>
            {loading ? "확인 중..." : "관리자 인증"}
          </button>
        </div>

        {message ? <p className={kind}>{message}</p> : null}
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <h1>관리자</h1>
        <p className="muted">
          현재 저장된 최신 회차는 {latestNo.toLocaleString("ko-KR")}회입니다.
        </p>

        <AdminDrawForm
          latestNo={latestNo}
          secret={secret}
          onLogout={logout}
          onUpdated={() => setRefreshKey((value) => value + 1)}
        />
      </section>

      <section className="panel">
        <h2>업데이트 로그</h2>
        <p className="muted">
          Cron 자동 업데이트와 관리자 수동 업데이트 실행 결과를 확인합니다.
        </p>

        <UpdateLogList secret={secret} refreshKey={refreshKey} />
      </section>
    </>
  );
}
