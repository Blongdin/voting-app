import "server-only";
import { revalidatePath } from "next/cache";

/**
 * 투표 상태(만들기, 표, 마감, 삭제)가 바뀌었을 때 그 상태를 보여 주는 화면을 새로 그린다.
 * pollId가 있으면 그 투표의 참여자 화면과 운영자 결과 화면도 포함한다.
 */
export function revalidatePollPages(pollId?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  if (pollId) {
    revalidatePath(`/polls/${pollId}`);
    revalidatePath(`/admin/polls/${pollId}`);
  }
}
