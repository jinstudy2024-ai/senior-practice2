import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-3xl font-black text-brand-800">이력서 등록</h1>
      <p className="mb-6 text-gray-600">
        시니어 정보를 입력해 주세요. 이름·지역·희망 직종·경력만 입력하시면 됩니다.
      </p>
      <RegisterForm />
    </div>
  );
}
