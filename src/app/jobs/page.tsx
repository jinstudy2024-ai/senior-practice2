import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JOB_CATEGORIES, REGIONS } from "@/lib/constants";
import JobsFilterBar from "./JobsFilterBar";

type SearchParams = Promise<{
  region?: string;
  category?: string;
  q?: string;
  maxExp?: string;
}>;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("jobs").select("*").order("created_at", { ascending: false });
  if (sp.region) query = query.eq("region", sp.region);
  if (sp.category) query = query.eq("job_category", sp.category);
  if (sp.maxExp) query = query.lte("required_experience", Number(sp.maxExp));
  if (sp.q) query = query.or(`company.ilike.%${sp.q}%,job_category.ilike.%${sp.q}%`);

  const { data: jobs, error } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-brand-800">일자리 검색</h1>
        <p className="mt-1 text-gray-600">지역·직종·키워드로 일자리를 찾아보세요.</p>
      </div>

      <JobsFilterBar
        regions={REGIONS as readonly string[]}
        categories={JOB_CATEGORIES as readonly string[]}
        initial={{
          region: sp.region ?? "",
          category: sp.category ?? "",
          q: sp.q ?? "",
          maxExp: sp.maxExp ?? "",
        }}
      />

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          불러오기 실패: {error.message}
        </div>
      )}

      <div className="text-sm text-gray-600">총 {jobs?.length ?? 0}건</div>

      <div className="grid gap-4 md:grid-cols-2">
        {(jobs ?? []).map((job) => (
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
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-sm">
              <div className="text-gray-600">
                {job.salary && <span className="font-bold text-brand-700">{job.salary}</span>}
                {job.deadline && (
                  <span className="ml-3 text-gray-500">~ {new Date(job.deadline).toLocaleDateString("ko-KR")}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {(jobs?.length ?? 0) === 0 && (
          <div className="col-span-full rounded-md border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            조건에 맞는 일자리가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
