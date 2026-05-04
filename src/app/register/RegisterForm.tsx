"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { JOB_CATEGORIES, REGIONS } from "@/lib/constants";

type SeniorRow = {
  id: string;
  user_id: string;
  full_name: string;
  age: number;
  region: string;
  job_category: string;
  years_experience: number;
  resume_url: string | null;
};

const MAX_PDF_BYTES = 5 * 1024 * 1024;

export default function RegisterForm({ initial }: { initial: SeniorRow | null }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [age, setAge] = useState<number | "">(initial?.age ?? "");
  const [region, setRegion] = useState(initial?.region ?? REGIONS[0]);
  const [category, setCategory] = useState(initial?.job_category ?? JOB_CATEGORIES[0]);
  const [years, setYears] = useState<number | "">(initial?.years_experience ?? 0);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);

    if (pdfFile) {
      if (pdfFile.type !== "application/pdf") {
        setError("PDF 파일만 업로드 가능합니다.");
        setPending(false);
        return;
      }
      if (pdfFile.size > MAX_PDF_BYTES) {
        setError("이력서는 최대 5MB까지 업로드 가능합니다.");
        setPending(false);
        return;
      }
    }

    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("로그인이 필요합니다.");
      setPending(false);
      return;
    }

    let resumeUrl = initial?.resume_url ?? null;

    if (pdfFile) {
      const path = `${user.id}/${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("resumes")
        .upload(path, pdfFile, { contentType: "application/pdf", upsert: true });
      if (upErr) {
        setError("이력서 업로드 실패: " + upErr.message);
        setPending(false);
        return;
      }
      const { data: pub } = supabase.storage.from("resumes").getPublicUrl(path);
      resumeUrl = pub.publicUrl;
    }

    const payload = {
      user_id: user.id,
      full_name: fullName,
      age: Number(age),
      region,
      job_category: category,
      years_experience: Number(years),
      resume_url: resumeUrl,
    };

    const { data: seniorRow, error: upsertErr } = await supabase
      .from("seniors")
      .upsert(payload, { onConflict: "user_id" })
      .select("id")
      .single();

    if (upsertErr || !seniorRow) {
      setError("저장 실패: " + (upsertErr?.message ?? "알 수 없는 오류"));
      setPending(false);
      return;
    }

    const { error: matchErr } = await supabase.rpc("run_matching", {
      p_senior_id: seniorRow.id,
    });
    if (matchErr) {
      setError("매칭 실행 실패: " + matchErr.message);
      setPending(false);
      return;
    }

    setInfo("저장 및 매칭이 완료되었습니다. 추천 페이지로 이동합니다...");
    setTimeout(() => {
      router.push("/recommendations");
      router.refresh();
    }, 600);
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <div>
        <label className="label" htmlFor="full_name">이름</label>
        <input id="full_name" required className="input"
          value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="age">나이</label>
          <input id="age" type="number" min={40} max={100} required className="input"
            value={age} onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div>
          <label className="label" htmlFor="years">경력 (년)</label>
          <input id="years" type="number" min={0} max={60} required className="input"
            value={years} onChange={(e) => setYears(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="region">지역</label>
          <select id="region" className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="category">희망 직종</label>
          <select id="category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {JOB_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="pdf">이력서 PDF (선택, 최대 5MB)</label>
        <input id="pdf" type="file" accept="application/pdf"
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:font-bold file:text-white hover:file:bg-brand-600"
          onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} />
        {initial?.resume_url && (
          <p className="mt-2 text-xs text-gray-500">
            현재 등록된 이력서:{" "}
            <a className="font-bold text-brand-500 underline" target="_blank" rel="noreferrer" href={initial.resume_url}>
              열기
            </a>
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
      )}
      {info && (
        <div className="rounded-md bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700">{info}</div>
      )}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "저장 중..." : initial ? "수정하고 다시 매칭" : "등록하고 매칭 시작"}
      </button>
    </form>
  );
}
