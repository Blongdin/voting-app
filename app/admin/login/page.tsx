import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-session";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">운영자 로그인</h1>
      <LoginForm />
    </main>
  );
}
