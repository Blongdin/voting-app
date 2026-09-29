import { redirect } from "next/navigation";
import { Page, Title, TopBar } from "@/app/components/ui";
import { isAdmin } from "@/lib/admin-session";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <Page>
      <TopBar back={{ href: "/", label: "홈" }} />
      <Title sub="투표를 만들고 마감하려면 로그인하세요.">운영자 로그인</Title>
      <LoginForm />
    </Page>
  );
}
