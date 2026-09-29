import Link from "next/link";
import { buttonClass, Page } from "@/app/components/ui";

export default function PollNotFound() {
  return (
    <Page>
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
        <div aria-hidden className="mb-6 flex size-16 items-center justify-center rounded-full bg-surface text-3xl">
          ?
        </div>
        <h1 className="text-[22px] font-bold text-text">찾을 수 없는 투표</h1>
        <p className="mt-2 text-[15px] text-muted">삭제되었거나 존재하지 않는 투표입니다.</p>
        <Link href="/" className={`${buttonClass("secondary", "medium")} mt-8`}>
          투표 목록으로
        </Link>
      </div>
    </Page>
  );
}
