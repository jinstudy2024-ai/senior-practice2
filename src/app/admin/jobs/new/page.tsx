import JobForm from "../JobForm";

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-black text-brand-800">새 일자리 등록</h1>
      <JobForm />
    </div>
  );
}
