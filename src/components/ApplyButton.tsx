"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ApplyButton({
  jobId,
  seniorId,
  alreadyApplied,
}: {
  jobId: string;
  seniorId: string;
  alreadyApplied: boolean;
}) {
  const router = useRouter();
  const [applied, setApplied] = useState(alreadyApplied);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    setPending(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("applications")
      .insert({ senior_id: seniorId, job_id: jobId });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    setApplied(true);
    setPending(false);
    router.refresh();
  }

  if (applied) {
    return (
      <span className="badge bg-green-100 text-green-700">✓ 지원완료</span>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button onClick={apply} disabled={pending} className="btn-primary px-4 py-2 text-sm">
        {pending ? "지원 중..." : "지원하기"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
