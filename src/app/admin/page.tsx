import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SAMPLE_JOBS = [
  { title: "카페 직원", region: "서울", job_type: "카페", required_career: 3 },
  { title: "경비원", region: "서울", job_type: "경비", required_career: 5 },
  { title: "청소원", region: "부산", job_type: "청소", required_career: 1 },
];

async function addJob(formData: FormData) {
  "use server";
  const title = String(formData.get("title") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const job_type = String(formData.get("job_type") ?? "").trim();
  const required_career = Math.max(
    0,
    Math.floor(Number(formData.get("required_career") ?? 0)),
  );
  if (!title || !region || !job_type) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("jobs").insert({ title, region, job_type, required_career });
  revalidatePath("/admin");
}

async function deleteJob(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("jobs").delete().eq("id", id);
  revalidatePath("/admin");
}

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true });
  if ((count ?? 0) === 0) {
    await supabase.from("jobs").insert(SAMPLE_JOBS);
  }

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, title, region, job_type, required_career, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-brand-800">일자리 관리</h1>
        <p className="mt-1 text-gray-600">총 {jobs?.length ?? 0}건</p>
      </div>

      <section className="card">
        <h2 className="mb-4 text-xl font-black text-brand-800">새 일자리 추가</h2>
        <form action={addJob} className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="label" htmlFor="title">제목</label>
            <input id="title" name="title" required className="input" placeholder="카페 직원" />
          </div>
          <div>
            <label className="label" htmlFor="region">지역</label>
            <input id="region" name="region" required className="input" placeholder="서울" />
          </div>
          <div>
            <label className="label" htmlFor="job_type">직종</label>
            <input id="job_type" name="job_type" required className="input" placeholder="카페" />
          </div>
          <div>
            <label className="label" htmlFor="required_career">요구 경력 (년)</label>
            <input
              id="required_career"
              name="required_career"
              type="number"
              min={0}
              max={60}
              step={1}
              required
              className="input"
              defaultValue={0}
            />
          </div>
          <div className="md:col-span-4">
            <button type="submit" className="btn-primary">+ 추가</button>
          </div>
        </form>
      </section>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          불러오기 실패: {error.message}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-brand-700">
            <tr>
              <th className="px-4 py-3 font-bold">제목</th>
              <th className="px-4 py-3 font-bold">지역</th>
              <th className="px-4 py-3 font-bold">직종</th>
              <th className="px-4 py-3 font-bold">요구 경력</th>
              <th className="px-4 py-3 font-bold">등록일</th>
              <th className="px-4 py-3 text-right font-bold">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(jobs ?? []).map((j) => (
              <tr key={j.id}>
                <td className="px-4 py-3 font-bold text-brand-800">{j.title}</td>
                <td className="px-4 py-3">{j.region}</td>
                <td className="px-4 py-3">{j.job_type}</td>
                <td className="px-4 py-3">{j.required_career}년+</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(j.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteJob} className="inline">
                    <input type="hidden" name="id" value={j.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(jobs?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  등록된 일자리가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
