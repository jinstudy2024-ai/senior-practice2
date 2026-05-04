"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { JOB_CATEGORIES, REGIONS } from "@/lib/constants";

type JobRow = {
  id: string;
  company: string;
  region: string;
  job_category: string;
  required_experience: number;
  salary: string | null;
  deadline: string | null;
};

export default function JobForm({ initial }: { initial?: JobRow }) {
  const router = useRouter();
  const [company, setCompany] = useState(initial?.company ?? "");
  const [region, setRegion] = useState(initial?.region ?? REGIONS[0]);
  const [category, setCategory] = useState(initial?.job_category ?? JOB_CATEGORIES[0]);
  const [experience, setExperience] = useState<number>(initial?.required_experience ?? 0);
  const [salary, setSalary] = useState(initial?.salary ?? "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      company,
      region,
      job_category: category,
      required_experience: experience,
      salary: salary || null,
      deadline: deadline || null,
      created_by: user?.id ?? null,
    };

    const result = initial
      ? await supabase.from("jobs").update(payload).eq("id", initial.id)
      : await supabase.from("jobs").insert(payload);

    if (result.error) {
      setError(result.error.message);
      setPending(false);
      return;
    }
    router.push("/admin/jobs");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <div>
        <label className="label" htmlFor="company">회사명</label>
        <input id="company" required className="input"
          value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="region">지역</label>
          <select id="region" className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="category">직종</label>
          <select id="category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {JOB_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="experience">필요 경력 (년)</label>
          <input id="experience" type="number" min={0} className="input"
            value={experience} onChange={(e) => setExperience(Number(e.target.value))} />
        </div>
        <div>
          <label className="label" htmlFor="salary">급여 (자유 입력)</label>
          <input id="salary" className="input" placeholder="예: 월 220만원"
            value={salary} onChange={(e) => setSalary(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="deadline">마감일</label>
        <input id="deadline" type="date" className="input"
          value={deadline ?? ""} onChange={(e) => setDeadline(e.target.value)} />
      </div>
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
      )}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1" disabled={pending}>
          {pending ? "저장 중..." : initial ? "수정 완료" : "등록"}
        </button>
        <button type="button" onClick={() => router.push("/admin/jobs")} className="btn-outline">
          취소
        </button>
      </div>
    </form>
  );
}
