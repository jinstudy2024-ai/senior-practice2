import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const [{ count: seniorCount }, { count: jobCount }, { count: appCount }] = await Promise.all([
    supabase.from("seniors").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("applications").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-brand-800">관리자 대시보드</h1>
        <p className="mt-1 text-gray-600">플랫폼 운영 KPI 한눈에 보기</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="등록 시니어" value={seniorCount ?? 0} sub="명" href="/admin/applicants" />
        <KpiCard label="등록 일자리" value={jobCount ?? 0}    sub="개" href="/admin/jobs" />
        <KpiCard label="누적 지원" value={appCount ?? 0}     sub="건" href="/admin/applicants" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/jobs" className="card transition hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="text-lg font-black text-brand-800">일자리 관리 →</h3>
          <p className="mt-1 text-sm text-gray-600">일자리 등록 · 수정 · 삭제</p>
        </Link>
        <Link href="/admin/applicants" className="card transition hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="text-lg font-black text-brand-800">지원자 목록 →</h3>
          <p className="mt-1 text-sm text-gray-600">시니어별 지원 현황 · 이력서 다운로드</p>
        </Link>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, href }: { label: string; value: number; sub: string; href: string }) {
  return (
    <Link href={href} className="card transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="text-sm font-bold text-brand-500">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-black text-brand-800">{value.toLocaleString()}</span>
        <span className="text-base font-bold text-gray-500">{sub}</span>
      </div>
    </Link>
  );
}
