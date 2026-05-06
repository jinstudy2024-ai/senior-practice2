import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-8 py-14 text-white shadow-lg">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-bold opacity-90">시니어 일자리 자동 매칭</p>
          <h1 className="text-3xl font-black leading-tight md:text-5xl">
            경험을 다시 일터로.
            <br />
            <span className="text-brand-100">AI 가 맞춤 일자리를 찾아드립니다.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-brand-50">
            이력서를 등록하면 지역·직종·경력을 기준으로 자동 매칭 점수를 계산해 추천합니다.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-md bg-white px-6 py-3 text-base font-bold text-brand-500 hover:bg-brand-50">
              이력서 등록 시작
            </Link>
            <Link href="/jobs" className="rounded-md border-2 border-white px-6 py-3 text-base font-bold text-white hover:bg-white/10">
              일자리 둘러보기
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <FeatureCard
          step="01"
          title="이력서 등록"
          desc="이름·지역·희망 직종·경력을 입력하세요."
        />
        <FeatureCard
          step="02"
          title="AI 자동 매칭"
          desc="등록 즉시 모든 일자리에 대해 점수(지역+3 / 직종+2 / 경력+1)를 계산합니다."
        />
        <FeatureCard
          step="03"
          title="원클릭 지원"
          desc="추천 목록에서 마음에 드는 일자리에 바로 지원하세요."
        />
      </section>
    </div>
  );
}

function FeatureCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="card transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="text-sm font-black text-brand-500">STEP {step}</div>
      <h3 className="mt-2 text-xl font-black text-brand-800">{title}</h3>
      <p className="mt-2 leading-relaxed text-gray-600">{desc}</p>
    </div>
  );
}
