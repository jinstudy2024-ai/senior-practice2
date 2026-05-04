"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"senior" | "admin">("senior");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });

    if (signupError) {
      setError(signupError.message);
      setPending(false);
      return;
    }

    // 이메일 확인이 꺼져있으면 session 이 즉시 생김
    if (data.session) {
      // role 확실히 반영
      await supabase.from("profiles").upsert({
        id: data.user!.id,
        email: data.user!.email!,
        role,
      });
      router.push(role === "admin" ? "/admin" : "/register");
      router.refresh();
      return;
    }

    setInfo("가입 완료! 이메일 인증이 켜져 있다면 메일함을 확인한 뒤 로그인하세요.");
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <div>
        <label className="label" htmlFor="email">이메일</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="password">비밀번호 (6자 이상)</label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <fieldset>
        <legend className="label">가입 유형</legend>
        <div className="grid grid-cols-2 gap-3">
          <RoleOption
            checked={role === "senior"}
            onChange={() => setRole("senior")}
            title="시니어 (구직자)"
            desc="이력서 등록 · 일자리 지원"
          />
          <RoleOption
            checked={role === "admin"}
            onChange={() => setRole("admin")}
            title="담당자"
            desc="일자리 등록 · 지원자 관리"
          />
        </div>
      </fieldset>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
      )}
      {info && (
        <div className="rounded-md bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700">{info}</div>
      )}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "가입 중..." : "가입하기"}
      </button>

      <p className="text-center text-sm text-gray-600">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-bold text-brand-500 hover:underline">로그인</Link>
      </p>
    </form>
  );
}

function RoleOption({
  checked,
  onChange,
  title,
  desc,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  desc: string;
}) {
  return (
    <label
      className={`cursor-pointer rounded-md border-2 p-4 transition ${
        checked ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-brand-300"
      }`}
    >
      <input type="radio" name="role" checked={checked} onChange={onChange} className="sr-only" />
      <div className="font-bold text-brand-800">{title}</div>
      <div className="mt-0.5 text-xs text-gray-600">{desc}</div>
    </label>
  );
}
