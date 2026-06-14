# 로또스탯픽 - 로또 통계형 번호 추첨기

Next.js + Supabase 기반 로또 번호 추천 웹앱입니다.

## 현재 구조

- `/` : 추천번호 생성, 최신 당첨번호, 저장번호 비교
- `/stats` : 번호별 통계
- `/history` : 역대 당첨번호 최근 200개 표시
- `/admin` : 관리자 회차 수동 저장, 최신 회차 자동 확인, 업데이트 로그 확인
- `/api/generate` : 추천번호 생성 API
- `/api/draws/latest` : 최신 1회차만 조회하는 가벼운 API
- `/api/update-latest` : 동행복권 회차 동기화 API
- `/api/cron/update-latest` : Vercel Cron용 업데이트 API

## 로컬 실행

```powershell
npm install
copy .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

## Supabase 설정

1. Supabase 프로젝트 생성
2. `supabase/schema.sql` 전체를 SQL Editor에서 실행
3. `.env.local`에 아래 값 입력
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_SECRET`
   - `CRON_SECRET`
4. 초기 데이터 업로드

```powershell
npm run import:supabase
```

## 최신 회차 동기화

DB가 오래된 경우 아래 명령으로 현재 공개된 회차까지 순차 저장합니다.

```powershell
npm run extract:excel
node scripts/sync-latest-draws.mjs
```

관리자 페이지에서는 `최신 회차 자동 확인` 버튼으로도 동기화할 수 있습니다. 기본적으로 한 번에 최대 30개 회차까지만 저장합니다. 더 많이 따라잡아야 하면 `.env.local`의 `LOTTO_MAX_SYNC_COUNT` 값을 늘리세요.

## 배포

Vercel 프로젝트 환경변수에 `.env.local`과 같은 값을 등록하세요. `vercel.json`은 매주 일요일 00:00 UTC에 `/api/cron/update-latest`를 호출합니다. 한국시간 기준 일요일 오전입니다.

## 보안 주의

`.env`, `.env.local`, Supabase service role key는 절대 GitHub나 ZIP으로 공유하지 마세요. service role key가 외부로 노출되면 Supabase에서 즉시 재발급하세요.

## 주의

로또는 독립 확률 게임입니다. 이 앱은 과거 번호 기반 통계/필터링 도구이며 당첨을 보장하지 않습니다.
