# 로또 통계형 추첨기 웹앱 V1

업로드된 엑셀 파일을 초기 데이터로 변환해 만든 Next.js + Supabase + Vercel 기반 웹앱입니다.

- 초기 데이터: 1139개 회차
- 최신 회차: 1139회 / 2024-09-28
- 기본 모드: Supabase가 없어도 `data/lotto-draws.json`으로 실행
- 확장 모드: Supabase 연결 시 DB 저장, 관리자 회차 추가, 자동 업데이트 가능

## 1. 로컬 실행

```powershell
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

## 2. Supabase 연결

1. Supabase 프로젝트 생성
2. `supabase/schema.sql`을 SQL Editor에서 실행
3. `.env.example`을 `.env.local`로 복사
4. Supabase URL, anon key, service role key 입력
5. 초기 데이터 업로드

```powershell
npm run import:supabase
```

## 3. 관리자 회차 추가

`/admin` 페이지에서 `.env.local`의 `ADMIN_SECRET` 값을 입력하고 회차를 저장합니다.

## 4. 자동 업데이트

Vercel 배포 후 `vercel.json`의 Cron 설정으로 매주 토요일 15:30 UTC, 즉 한국시간 일요일 00:30에 `/api/update-latest`가 호출됩니다.
동행복권 조회 응답 방식이 변경될 수 있으므로 관리자 수동 입력 기능을 반드시 유지하세요.

## 5. 주의

로또는 독립 확률 게임입니다. 이 앱은 과거 번호 기반 통계/필터링 도구이며 당첨을 보장하지 않습니다.
