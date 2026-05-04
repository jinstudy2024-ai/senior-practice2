import Link from "next/link";
import { getUserAndProfile } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function Nav() {
  const { user, profile } = await getUserAndProfile();
  const role = profile?.role;

  return (
    <header className="border-b border-brand-700 bg-brand-500 text-white">
      <div className="mx-auto flex max-w-page items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="text-xl font-black tracking-tight">
          시니어 잡매칭
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-bold md:flex">
          {role === "senior" && (
            <>
              <NavLink href="/register">이력서</NavLink>
              <NavLink href="/jobs">일자리 검색</NavLink>
              <NavLink href="/recommendations">AI 추천</NavLink>
              <NavLink href="/my-applications">지원현황</NavLink>
            </>
          )}
          {role === "admin" && (
            <>
              <NavLink href="/admin">대시보드</NavLink>
              <NavLink href="/admin/jobs">일자리 관리</NavLink>
              <NavLink href="/admin/applicants">지원자</NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <span className="hidden text-brand-50 sm:inline">
                {profile?.email}
                <span className="ml-2 rounded bg-white/20 px-2 py-0.5 text-xs">
                  {role === "admin" ? "담당자" : "시니어"}
                </span>
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded px-3 py-1.5 font-bold hover:bg-white/10"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded bg-white px-3 py-1.5 font-bold text-brand-500 hover:bg-brand-50"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded px-3 py-1.5 hover:bg-white/10"
    >
      {children}
    </Link>
  );
}
