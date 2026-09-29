import { PollList } from "@/app/components/poll-list";
import { buttonClass, Card, Page, SectionTitle, Title, TopBar } from "@/app/components/ui";
import { requireAdmin } from "@/lib/admin-session";
import { listPolls } from "@/lib/polls";
import { logout } from "./actions";
import { CreatePollForm } from "./create-poll-form";

export default async function AdminPage() {
  await requireAdmin();
  const polls = await listPolls();

  return (
    <Page>
      <TopBar
        back={{ href: "/", label: "홈" }}
        right={
          <form action={logout}>
            <button type="submit" className={buttonClass("neutral", "small")}>
              로그아웃
            </button>
          </form>
        }
      />
      <Title>운영자</Title>

      <Card className="mb-8">
        <SectionTitle>새 투표</SectionTitle>
        <CreatePollForm />
      </Card>

      <SectionTitle>모든 투표</SectionTitle>
      <PollList polls={polls} hrefBase="/admin/polls" />
    </Page>
  );
}
