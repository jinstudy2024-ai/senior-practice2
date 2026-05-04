"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setPending(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      router.push(profile?.role === "admin" ? "/admin" : "/recommendations");
      router.refresh();
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <div>
        <label className="label" htmlFor="email">이메일</label>
        <input
          id="email" type="email" required autoComplete="email"
          className="input" value={email} onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="password">비밀번호</label>
        <input
          id="password" type="password" required autoComplete="current-password"
          className="input" value={password} onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
      )}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "로그인 중..." : "로그인"}
      </button>
      <p className="text-center text-sm text-gray-600">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-bold text-brand-500 hover:underline">회원가입</Link>
      </p>
    </form>
  );
}
