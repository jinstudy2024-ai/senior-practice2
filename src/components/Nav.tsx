import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b border-brand-700 bg-brand-500 text-white">
      <div className="mx-auto flex max-w-page items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="text-xl font-black tracking-tight">
          시니어 잡매칭
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-bold md:flex">
          <NavLink href="/register">이력서 등록</NavLink>
          <NavLink href="/jobs">일자리 검색</NavLink>
          <NavLink href="/recommendations">AI 추천</NavLink>
          <NavLink href="/admin">대시보드</NavLink>
        </nav>
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
