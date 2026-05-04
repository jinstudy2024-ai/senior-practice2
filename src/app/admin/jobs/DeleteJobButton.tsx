"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DeleteJobButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!confirm("이 일자리를 삭제하시겠습니까?")) return;
    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) alert("삭제 실패: " + error.message);
    else router.refresh();
    setPending(false);
  }

  return (
    <button onClick={onDelete} disabled={pending}
      className="font-bold text-red-600 hover:underline disabled:opacity-50">
      {pending ? "삭제 중..." : "삭제"}
    </button>
  );
}
