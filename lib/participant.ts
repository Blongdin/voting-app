import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { isAdmin } from "@/lib/admin-session";
import { isUuid, type Actor } from "@/lib/polls";

// 참여자 쿠키(ADR-0001). 로그인 없이 브라우저 단위로 참여자를 구분한다.
// __Host- 접두사: Secure, Path=/, Domain 없음이 강제된다.
const PARTICIPANT_COOKIE = "__Host-participant_id";
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

async function cookieParticipantId(): Promise<string | undefined> {
  const value = (await cookies()).get(PARTICIPANT_COOKIE)?.value;
  // 형식이 틀린 쿠키는 없는 것으로 본다.
  return value && isUuid(value) ? value : undefined;
}

/** 투표 화면의 행위자. 운영자도 여기서는 참여자로만 본다(운영자용 결과는 /admin/polls). */
export async function participantActor(): Promise<Actor> {
  return { isAdmin: false, participantId: await cookieParticipantId() };
}

/**
 * 결과를 보는 사람: 운영자 세션과 참여자 쿠키를 함께 본다.
 * 운영자 결과 화면과 결과 API가 같은 값을 써서, 첫 화면과 폴링 결과가 어긋나지 않게 한다.
 */
export async function resultsViewer(): Promise<Actor> {
  return { isAdmin: await isAdmin(), participantId: await cookieParticipantId() };
}

/**
 * 표를 낼 참여자 ID. 쿠키에 없으면 새로 만들지만 아직 발급하지는 않는다.
 * 표가 실제로 들어갔을 때만 rememberParticipant로 쿠키를 발급한다.
 */
export async function participantIdForVote(): Promise<{ participantId: string; isNew: boolean }> {
  const existing = await cookieParticipantId();
  return existing ? { participantId: existing, isNew: false } : { participantId: randomUUID(), isNew: true };
}

/** 첫 표가 들어간 뒤 참여자 쿠키를 1년 유효기간으로 발급한다. Server Action에서만 호출한다. */
export async function rememberParticipant(participantId: string) {
  (await cookies()).set(PARTICIPANT_COOKIE, participantId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}
