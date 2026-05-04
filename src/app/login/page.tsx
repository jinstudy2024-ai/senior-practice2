import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-3xl font-black text-brand-800">로그인</h1>
      <p className="mb-6 text-gray-600">이메일과 비밀번호를 입력하세요.</p>
      <LoginForm />
    </div>
  );
}
