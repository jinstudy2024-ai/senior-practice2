import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  role: "senior" | "admin";
};

export async function getUserAndProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null as Profile | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  return { user, profile: (profile ?? null) as Profile | null };
}

export async function requireUser() {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");
  return { user, profile };
}

export async function requireSenior() {
  const { user, profile } = await requireUser();
  if (profile?.role !== "senior") redirect("/");
  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await requireUser();
  if (profile?.role !== "admin") redirect("/");
  return { user, profile };
}
