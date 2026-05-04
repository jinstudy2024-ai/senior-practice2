import { requireSenior } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  const { user } = await requireSenior();
  const supabase = await createSupabaseServerClient();
  const { data: senior } = await supabase
    .from("seniors")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-3xl font-black text-brand-800">이력서 등록</h1>
      <p className="mb-6 text-gray-600">
        등록 즉시 모든 일자리에 대한 매칭 점수가 자동으로 계산됩니다.
      </p>
      <RegisterForm initial={senior} />
    </div>
  );
}
