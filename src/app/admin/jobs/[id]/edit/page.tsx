import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import JobForm from "../../JobForm";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
  if (!job) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-black text-brand-800">일자리 수정</h1>
      <JobForm initial={job} />
    </div>
  );
}
