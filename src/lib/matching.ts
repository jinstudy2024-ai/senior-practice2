import type { SupabaseClient } from "@supabase/supabase-js";

export type MatchSenior = {
  id: string;
  region: string;
  desired_job: string;
  career_years: number;
};

export type MatchJob = {
  id: string;
  region: string;
  job_type: string;
  required_career: number;
};

export const MAX_SCORE = 6;

export function calculateScore(senior: MatchSenior, job: MatchJob): number {
  let score = 0;
  if (senior.region === job.region) score += 3;
  if (senior.desired_job === job.job_type) score += 2;
  if (senior.career_years >= job.required_career) score += 1;
  return score;
}

export async function recomputeAllMatches(supabase: SupabaseClient): Promise<{
  inserted: number;
  error: string | null;
}> {
  const [
    { data: seniors, error: seniorsErr },
    { data: jobs, error: jobsErr },
  ] = await Promise.all([
    supabase.from("seniors").select("id, region, desired_job, career_years"),
    supabase.from("jobs").select("id, region, job_type, required_career"),
  ]);
  if (seniorsErr) return { inserted: 0, error: `seniors: ${seniorsErr.message}` };
  if (jobsErr) return { inserted: 0, error: `jobs: ${jobsErr.message}` };

  const rows = (seniors ?? []).flatMap((s) =>
    (jobs ?? []).map((j) => ({
      senior_id: s.id as string,
      job_id: j.id as string,
      score: calculateScore(s as MatchSenior, j as MatchJob),
    })),
  );

  const { error: delErr } = await supabase.from("matches").delete().gte("score", 0);
  if (delErr) return { inserted: 0, error: `delete: ${delErr.message}` };

  if (rows.length === 0) return { inserted: 0, error: null };

  const { error: insErr } = await supabase.from("matches").insert(rows);
  if (insErr) return { inserted: 0, error: `insert: ${insErr.message}` };

  return { inserted: rows.length, error: null };
}
