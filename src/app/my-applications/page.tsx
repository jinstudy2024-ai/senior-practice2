import Link from "next/link";
import { requireSenior } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  submitted: { text: "지원완료", cls: "bg-brand-50 text-brand-700" },
  reviewing: { text: "검토중", cls: "bg-yellow-100 text-yellow-700" },
  accepted:  { text: "합격", cls: "bg-green-100 text-green-700" },
  rejected:  { text: "불합격", cls: "bg-gray-200 text-gray-700" },
};

export default async function MyApplicationsPage() {
  const { user } = await requireSenior();
  const supabase = await createSupabaseServerClient();

  const { data: senior } = await supabase
    .from("seniors").select("id, full_name").eq("user_id", user.id).maybeSingle();

  if (!senior) {
    return (
      <div className="card text-center">
        <h1 className="text-2xl font-black text-brand-800">먼저 이력서를 등록해 주세요</h1>
        <Link href="/register" className="btn-primary mt-5 inline-block">이력서 등록</Link>
      </div>
    );
  }

  const { data: apps } = await supabase
    .from("applications")
    .select("id, status, applied_at, jobs:job_id(id, company, region, job_category, salary)")
    .eq("senior_id", senior.id)
    .order("applied_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-brand-800">내 지원 현황</h1>
        <p className="mt-1 text-gray-600">총 {apps?.length ?? 0}건 지원</p>
      </div>

      {(!apps || apps.length === 0) && (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          아직 지원한 일자리가 없습니다.{" "}
          <Link href="/recommendations" className="font-bold text-brand-500 underline">추천 보기</Link>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-brand-700">
            <tr>
              <th className="px-4 py-3 font-bold">회사</th>
              <th className="px-4 py-3 font-bold">지역 / 직종</th>
              <th className="px-4 py-3 font-bold">급여</th>
              <th className="px-4 py-3 font-bold">지원일</th>
              <th className="px-4 py-3 font-bold">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(apps ?? []).map((a) => {
              const job = (a as any).jobs;
              const status = STATUS_LABEL[a.status] ?? STATUS_LABEL.submitted;
              return (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-bold text-brand-800">{job?.company ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{job?.region} · {job?.job_category}</td>
                  <td className="px-4 py-3 text-gray-700">{job?.salary ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(a.applied_at).toLocaleString("ko-KR")}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${status.cls}`}>{status.text}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
