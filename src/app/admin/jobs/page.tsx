import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DeleteJobButton from "./DeleteJobButton";

export default async function AdminJobsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: jobs } = await supabase
    .from("jobs").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-800">일자리 관리</h1>
          <p className="mt-1 text-gray-600">총 {jobs?.length ?? 0}개</p>
        </div>
        <Link href="/admin/jobs/new" className="btn-primary">+ 새 일자리</Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-brand-700">
            <tr>
              <th className="px-4 py-3 font-bold">회사</th>
              <th className="px-4 py-3 font-bold">지역</th>
              <th className="px-4 py-3 font-bold">직종</th>
              <th className="px-4 py-3 font-bold">경력</th>
              <th className="px-4 py-3 font-bold">급여</th>
              <th className="px-4 py-3 font-bold">마감</th>
              <th className="px-4 py-3 font-bold text-right">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(jobs ?? []).map((j) => (
              <tr key={j.id}>
                <td className="px-4 py-3 font-bold text-brand-800">{j.company}</td>
                <td className="px-4 py-3">{j.region}</td>
                <td className="px-4 py-3">{j.job_category}</td>
                <td className="px-4 py-3">{j.required_experience}년+</td>
                <td className="px-4 py-3">{j.salary ?? "-"}</td>
                <td className="px-4 py-3 text-gray-500">
                  {j.deadline ? new Date(j.deadline).toLocaleDateString("ko-KR") : "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/jobs/${j.id}/edit`} className="mr-2 font-bold text-brand-500 hover:underline">
                    수정
                  </Link>
                  <DeleteJobButton id={j.id} />
                </td>
              </tr>
            ))}
            {(jobs?.length ?? 0) === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                등록된 일자리가 없습니다.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
