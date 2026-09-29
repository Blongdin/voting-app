import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { isUuid, type Actor } from "@/lib/polls";

// 참여자 쿠키(ADR-0001). 로그인 없이 브라우저 단위로 참여자를 구분한다.
// __Host- 접두사: Secure, Path=/, Domain 없음이 강제된다.
const PARTICIPANT_COOKIE = "__Host-participant_id";
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

/** 투표 화면에서 쓰는 보는 사람. 운영자도 여기서는 참여자로만 본다. */
export async function participantViewer(): Promise<Actor> {
  const participantId = (await cookies()).get(PARTICIPANT_COOKIE)?.value;
  return { isAdmin: false, participantId };
}

/** 참여자 ID를 돌려준다. 없으면 새로 만들어 쿠키로 발급한다. Server Action에서만 호출한다. */
export async function ensureParticipantId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(PARTICIPANT_COOKIE)?.value;
  const participantId = existing && isUuid(existing) ? existing : randomUUID();
  // 표를 낼 때마다 유효기간을 1년으로 다시 늘린다.
  store.set(PARTICIPANT_COOKIE, participantId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  return participantId;
}
