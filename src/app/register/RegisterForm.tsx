"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { JOB_CATEGORIES, REGIONS } from "@/lib/constants";

export default function RegisterForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [region, setRegion] = useState<string>(REGIONS[0]);
  const [desiredJob, setDesiredJob] = useState<string>(JOB_CATEGORIES[0]);
  const [careerYears, setCareerYears] = useState<number | "">("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setRegion(REGIONS[0]);
    setDesiredJob(JOB_CATEGORIES[0]);
    setCareerYears("");
    formRef.current?.reset();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);

    const supabase = createSupabaseBrowserClient();
    const { data: inserted, error: insertErr } = await supabase
      .from("seniors")
      .insert({
        name,
        region,
        desired_job: desiredJob,
        career_years: Math.max(0, Math.floor(Number(careerYears))),
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      setError("등록 실패: " + insertErr?.message);
      setPending(false);
      return;
    }
    router.push(`/recommendations?senior=${inserted.id}`);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="card space-y-5">
      <div>
        <label className="label" htmlFor="name">이름</label>
        <input id="name" required className="input"
          value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <label className="label" htmlFor="career_years">경력 (년)</label>
        <input id="career_years" type="number" min={0} max={60} step={1} required className="input"
          value={careerYears}
          onChange={(e) => setCareerYears(e.target.value === "" ? "" : Number(e.target.value))} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="region">지역</label>
          <select id="region" required className="input"
            value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="desired_job">희망 직종</label>
          <select id="desired_job" required className="input"
            value={desiredJob} onChange={(e) => setDesiredJob(e.target.value)}>
            {JOB_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
      )}
      {info && (
        <div className="rounded-md bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700">{info}</div>
      )}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "저장 중..." : "등록"}
      </button>
    </form>
  );
}
