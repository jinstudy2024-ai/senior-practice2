import Link from "next/link";
import { requireSenior } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ApplyButton from "@/components/ApplyButton";

export default async function RecommendationsPage() {
  const { user } = await requireSenior();
  const supabase = await createSupabaseServerClient();

  const { data: senior } = await supabase
    .from("seniors").select("*").eq("user_id", user.id).maybeSingle();

  if (!senior) {
    return (
      <div className="card text-center">
        <h1 className="text-2xl font-black text-brand-800">먼저 이력서를 등록해 주세요</h1>
        <p className="mt-2 text-gray-600">등록 후 자동으로 매칭 점수가 계산됩니다.</p>
        <Link href="/register" className="btn-primary mt-5 inline-block">이력서 등록하러 가기</Link>
      </div>
    );
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("score, jobs:job_id(*)")
    .eq("senior_id", senior.id)
    .order("score", { ascending: false });

  const { data: apps } = await supabase
    .from("applications").select("job_id").eq("senior_id", senior.id);
  const appliedJobIds = new Set((apps ?? []).map((a) => a.job_id as string));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-brand-800">{senior.full_name} 님을 위한 AI 추천</h1>
        <p className="mt-1 text-gray-600">
          기준: 지역 <b>{senior.region}</b> · 직종 <b>{senior.job_category}</b> · 경력 <b>{senior.years_experience}년</b>
        </p>
      </div>

      {(!matches || matches.length === 0) && (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          매칭된 일자리가 없습니다.{" "}
          <Link href="/register" className="font-bold text-brand-500 underline">이력서를 다시 등록</Link>
          하면 매칭이 재실행됩니다.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {(matches ?? []).map((m) => {
          const job = (m as any).jobs as {
            id: string; company: string; region: string; job_category: string;
            required_experience: number; salary: string | null; deadline: string | null;
          } | null;
          if (!job) return null;
          return (
            <div key={job.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-brand-800">{job.company}</h3>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="badge bg-brand-50 text-brand-700">📍 {job.region}</span>
                    <span className="badge bg-brand-50 text-brand-700">💼 {job.job_category}</span>
                    <span className="badge bg-gray-100 text-gray-700">경력 {job.required_experience}년+</span>
                  </div>
                </div>
                <div className="rounded-lg bg-brand-500 px-4 py-2 text-center text-white shadow">
                  <div className="text-xs font-bold opacity-90">매칭점수</div>
                  <div className="text-2xl font-black">{m.score}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-sm">
                <div className="text-gray-600">
                  {job.salary && <span className="font-bold text-brand-700">{job.salary}</span>}
                  {job.deadline && (
                    <span className="ml-3 text-gray-500">~ {new Date(job.deadline).toLocaleDateString("ko-KR")}</span>
                  )}
                </div>
                <ApplyButton
                  jobId={job.id}
                  seniorId={senior.id}
                  alreadyApplied={appliedJobIds.has(job.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
