"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Initial = { region: string; category: string; q: string; maxExp: string };

export default function JobsFilterBar({
  regions,
  categories,
  initial,
}: {
  regions: readonly string[];
  categories: readonly string[];
  initial: Initial;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [region, setRegion] = useState(initial.region);
  const [category, setCategory] = useState(initial.category);
  const [q, setQ] = useState(initial.q);
  const [maxExp, setMaxExp] = useState(initial.maxExp);

  function apply() {
    const params = new URLSearchParams(sp.toString());
    region ? params.set("region", region) : params.delete("region");
    category ? params.set("category", category) : params.delete("category");
    q ? params.set("q", q) : params.delete("q");
    maxExp ? params.set("maxExp", maxExp) : params.delete("maxExp");
    router.push(`/jobs?${params.toString()}`);
  }

  function reset() {
    setRegion(""); setCategory(""); setQ(""); setMaxExp("");
    router.push("/jobs");
  }

  return (
    <div className="card grid gap-3 md:grid-cols-5">
      <select value={region} onChange={(e) => setRegion(e.target.value)} className="input">
        <option value="">전체 지역</option>
        {regions.map((r) => (<option key={r} value={r}>{r}</option>))}
      </select>
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
        <option value="">전체 직종</option>
        {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
      </select>
      <input
        placeholder="회사명 / 직종 키워드"
        className="input md:col-span-2"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
      />
      <input
        type="number" min={0} placeholder="내 경력(년)"
        className="input"
        value={maxExp}
        onChange={(e) => setMaxExp(e.target.value)}
      />
      <div className="flex gap-2 md:col-span-5">
        <button onClick={apply} className="btn-primary px-6 py-2 text-sm">검색</button>
        <button onClick={reset} className="btn-outline px-6 py-2 text-sm">초기화</button>
      </div>
    </div>
  );
}
