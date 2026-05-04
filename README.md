# 시니어 취업 매칭 플랫폼 (senior-practice2)

[PRD_Senior_Advanced.md](PRD_Senior_Advanced.md) 의 요구사항을 그대로 구현한 풀스택 데모입니다.

- **Next.js 15** (App Router, TypeScript) + **Tailwind CSS**
- **Supabase** Auth · Postgres · Storage
- 매칭 점수: 지역(+3) · 직종(+2) · 경력 충족(+1)

## 화면

| 경로 | 권한 | 설명 |
|---|---|---|
| `/` | 모두 | 랜딩 |
| `/signup`, `/login` | 모두 | 회원가입(시니어/담당자 역할 선택) · 로그인 |
| `/register` | 시니어 | 이력서 + PDF 업로드, 저장 시 자동 매칭 RPC 호출 |
| `/jobs` | 모두 | 일자리 검색 (지역·직종·키워드·경력 필터) |
| `/recommendations` | 시니어 | 자동 매칭 점수순 추천 + 지원 |
| `/my-applications` | 시니어 | 내 지원 현황 |
| `/admin` | 담당자 | KPI 카드 (시니어/일자리/지원 수) |
| `/admin/jobs` | 담당자 | 일자리 등록·수정·삭제 |
| `/admin/applicants` | 담당자 | 지원자 목록 + 이력서 다운로드 |

## 셋업

### 1. Supabase 프로젝트 준비

PRD 에 명시된 프로젝트가 이미 있다면 그대로 사용하세요.

1. <https://supabase.com> 콘솔 → 대상 프로젝트 → **SQL Editor**
2. [supabase/schema.sql](supabase/schema.sql) 전체 붙여넣고 **Run**
   - 테이블 (`profiles`, `seniors`, `jobs`, `matches`, `applications`)
   - 매칭 RPC `run_matching(p_senior_id)`
   - RLS 정책
   - `resumes` Storage 버킷 + 업로드/조회 정책
   - 샘플 일자리 10건
3. **Authentication → Providers → Email** 활성화
   - 데모용으로는 *Confirm email* 옵션을 꺼 두면 가입 즉시 로그인됩니다.

### 2. 환경변수

`.env.local` 이 이미 PRD 의 키로 채워져 있습니다. 다른 프로젝트로 바꾸려면:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 3. 로컬 실행

```bash
npm install
npm run dev
```

→ <http://localhost:3000>

### 4. 담당자 계정 만들기

회원가입 화면에서 "담당자" 라디오 선택 후 가입하면 됩니다.
이미 시니어로 가입했는데 담당자로 바꾸고 싶다면 Supabase SQL Editor 에서:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## Vercel 배포

1. GitHub 에 푸시
2. Vercel → **New Project** → 레포 선택
3. **Environment Variables** 에 `NEXT_PUBLIC_SUPABASE_URL` 과 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
4. Deploy

`.npmrc` 에 `legacy-peer-deps=true` 가 들어 있어 Vercel 빌드도 그대로 통과합니다.

## 디렉터리

```
senior-practice2/
├── PRD_Senior_Advanced.md
├── supabase/schema.sql
└── src/
    ├── middleware.ts
    ├── lib/
    │   ├── auth.ts                 # 서버 사이드 가드 (requireSenior/requireAdmin)
    │   ├── constants.ts            # REGIONS / JOB_CATEGORIES
    │   └── supabase/{client,server,middleware}.ts
    ├── components/{Nav,LogoutButton,ApplyButton}.tsx
    └── app/
        ├── layout.tsx · page.tsx · globals.css
        ├── signup/ · login/
        ├── register/                # 시니어 이력서
        ├── jobs/                    # 검색/필터
        ├── recommendations/         # AI 매칭
        ├── my-applications/         # 지원 현황
        └── admin/
            ├── page.tsx (KPI)
            ├── jobs/{page,JobForm,DeleteJobButton}.tsx
            ├── jobs/new/page.tsx
            ├── jobs/[id]/edit/page.tsx
            └── applicants/page.tsx
```

## 매칭 로직 (요약)

```sql
score =
    (지역 일치  ? 3 : 0)
  + (직종 일치  ? 2 : 0)
  + (경력 충족 ? 1 : 0)
```

`/register` 에서 이력서 저장 직후 `run_matching(p_senior_id)` RPC 가 호출되어
모든 일자리에 대해 점수를 다시 계산하고 `matches` 테이블을 갱신합니다.
