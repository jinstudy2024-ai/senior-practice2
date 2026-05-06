import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recomputeAllMatches, MAX_SCORE } from "@/lib/matching";

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ senior?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();

  const matchResult = await recomputeAllMatches(supabase);

  const { data: seniors } = await supabase
    .from("seniors")
    .select("id, name, region, desired_job, career_years")
    .order("created_at", { ascending: false });

  const senior =
    (sp.senior && (seniors ?? []).find((s) => s.id === sp.senior)) ||
    (seniors ?? [])[0] ||
    null;

  if (!senior) {
    return (
      <div className="card text-center">
        <h1 className="text-2xl font-black text-brand-800">먼저 이력서를 등록해 주세요</h1>
        <p className="mt-2 text-gray-600">등록 후 자동으로 매칭 점수가 계산됩니다.</p>
        <Link href="/register" className="btn-primary mt-5 inline-block">
          이력서 등록하러 가기
        </Link>
      </div>
    );
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("score, jobs:job_id(id, title, region, job_type, required_career)")
    .eq("senior_id", senior.id)
    .order("score", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-brand-800">
          {senior.name} 님을 위한 AI 추천
        </h1>
        <p className="mt-1 text-gray-600">
          기준: 지역 <b>{senior.region}</b> · 희망 직종 <b>{senior.desired_job}</b> · 경력{" "}
          <b>{senior.career_years}년</b>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          매칭 규칙 — 지역 +3 / 직종 +2 / 경력 충족 +1 (최대 {MAX_SCORE}점)
        </p>
      </div>

      {matchResult.error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          매칭 재계산 오류: {matchResult.error}
        </div>
      )}

      {(seniors ?? []).length > 1 && (
        <div className="card">
          <p className="label">시니어 선택</p>
          <ul className="flex flex-wrap gap-2">
            {(seniors ?? []).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/recommendations?senior=${s.id}`}
                  className={`badge ${
                    s.id === senior.id
                      ? "bg-brand-500 text-white"
                      : "bg-brand-50 text-brand-700"
                  }`}
                >
                  {s.name} · {s.region} · {s.desired_job}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(!matches || matches.length === 0) ? (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          매칭된 일자리가 없습니다.{" "}
          <Link href="/admin" className="font-bold text-brand-500 underline">
            /admin
          </Link>{" "}
          에서 일자리를 등록해 주세요.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((m) => {
            const job = (m as any).jobs as {
              id: string;
              title: string;
              region: string;
              job_type: string;
              required_career: number;
            } | null;
            if (!job) return null;
            const regionMatch = senior.region === job.region;
            const jobMatch = senior.desired_job === job.job_type;
            const careerMatch = senior.career_years >= job.required_career;
            return (
              <div key={job.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-brand-800">{job.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="badge bg-brand-50 text-brand-700">📍 {job.region}</span>
                      <span className="badge bg-brand-50 text-brand-700">💼 {job.job_type}</span>
                      <span className="badge bg-gray-100 text-gray-700">
                        경력 {job.required_career}년+
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-brand-500 px-4 py-2 text-center text-white shadow">
                    <div className="text-xs font-bold opacity-90">매칭점수</div>
                    <div className="text-2xl font-black">{m.score}</div>
                    <div className="text-xs opacity-80">/ {MAX_SCORE}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 border-t border-gray-100 pt-3 text-xs">
                  <ScoreChip on={regionMatch} text={`지역 ${regionMatch ? "+3" : "0"}`} />
                  <ScoreChip on={jobMatch} text={`직종 ${jobMatch ? "+2" : "0"}`} />
                  <ScoreChip on={careerMatch} text={`경력 ${careerMatch ? "+1" : "0"}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScoreChip({ on, text }: { on: boolean; text: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 font-bold ${
        on ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {on ? "✓" : "✗"} {text}
    </span>
  );
}
