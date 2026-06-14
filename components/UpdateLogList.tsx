"use client";

import { useEffect, useState } from "react";

type UpdateLog = {
  id: number;
  created_at: string;
  status: "success" | "error";
  message: string | null;
  saved_count: number;
  draw_nos: number[];
  error_message: string | null;
  source: string;
};

type UpdateLogListProps = {
  secret: string;
  refreshKey?: number;
};

export function UpdateLogList({ secret, refreshKey = 0 }: UpdateLogListProps) {
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadLogs() {
    if (!secret) {
      setLogs([]);
      setMessage("관리자 인증 후 로그를 조회할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/update-logs", {
        headers: {
          "x-admin-secret": secret,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "로그 조회 실패");
      }

      setLogs(json.logs || []);
      setMessage(`최근 ${json.logs?.length ?? 0}개 로그를 불러왔습니다.`);
    } catch (error) {
      setLogs([]);
      setMessage(error instanceof Error ? error.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, secret]);

  return (
    <div>
      <div className="controls">
        <button className="secondary" onClick={loadLogs} disabled={loading || !secret}>
          {loading ? "불러오는 중..." : "업데이트 로그 새로고침"}
        </button>
      </div>

      {message ? <p className="muted">{message}</p> : null}

      {logs.length > 0 ? (
        <div className="table-wrap" style={{ marginTop: 18 }}>
          <table>
            <thead>
              <tr>
                <th>시간</th>
                <th>상태</th>
                <th>구분</th>
                <th>메시지</th>
                <th>저장 수</th>
                <th>회차</th>
                <th>에러</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString("ko-KR")}</td>
                  <td>{log.status === "success" ? "성공" : "실패"}</td>
                  <td>{log.source === "cron" ? "자동" : "수동"}</td>
                  <td>{log.message || "-"}</td>
                  <td>{log.saved_count}</td>
                  <td>
                    {log.draw_nos && log.draw_nos.length > 0
                      ? log.draw_nos.join(", ")
                      : "-"}
                  </td>
                  <td>{log.error_message || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
