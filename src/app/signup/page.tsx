import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-3xl font-black text-brand-800">회원가입</h1>
      <p className="mb-6 text-gray-600">이메일과 비밀번호로 가입하세요.</p>
      <SignupForm />
    </div>
  );
}
