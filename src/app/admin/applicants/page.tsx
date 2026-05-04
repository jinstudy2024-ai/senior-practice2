import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminApplicantsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: apps } = await supabase
    .from("applications")
    .select(`
      id, status, applied_at,
      jobs:job_id(id, company, region, job_category),
      seniors:senior_id(id, full_name, age, region, job_category, years_experience, resume_url)
    `)
    .order("applied_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-brand-800">지원자 목록</h1>
        <p className="mt-1 text-gray-600">총 {apps?.length ?? 0}건</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-brand-700">
            <tr>
              <th className="px-4 py-3 font-bold">시니어</th>
              <th className="px-4 py-3 font-bold">프로필</th>
              <th className="px-4 py-3 font-bold">지원 일자리</th>
              <th className="px-4 py-3 font-bold">지원일</th>
              <th className="px-4 py-3 font-bold">상태</th>
              <th className="px-4 py-3 font-bold">이력서</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(apps ?? []).map((a) => {
              const senior = (a as any).seniors;
              const job = (a as any).jobs;
              return (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-bold text-brand-800">{senior?.full_name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {senior?.age}세 · {senior?.region} · {senior?.job_category} · 경력 {senior?.years_experience}년
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-brand-800">{job?.company}</div>
                    <div className="text-xs text-gray-500">{job?.region} · {job?.job_category}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(a.applied_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-brand-50 text-brand-700">{a.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {senior?.resume_url ? (
                      <a href={senior.resume_url} target="_blank" rel="noreferrer"
                        className="font-bold text-brand-500 hover:underline">
                        다운로드
                      </a>
                    ) : (
                      <span className="text-gray-400">없음</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {(apps?.length ?? 0) === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                지원 내역이 없습니다.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
