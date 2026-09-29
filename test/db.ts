import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";
import { createPoll, getPoll, type Poll } from "@/lib/polls";

// 테스트마다 테스트 DB를 비운다.
export async function resetDb() {
  await sql()`TRUNCATE polls, options, votes CASCADE`;
}

/** 운영자가 만든 진행 중 투표를 공개 인터페이스로 준비한다. */
export async function createOpenPoll(
  optionLabels: string[] = ["김밥", "라면"],
  question = "점심 뭐 먹을까요?",
): Promise<Poll> {
  const created = await createPoll({ isAdmin: true }, question, optionLabels);
  if (!created.ok) throw new Error("테스트 준비: 투표 만들기 실패");
  const poll = await getPoll(created.pollId);
  if (!poll) throw new Error("테스트 준비: 투표 조회 실패");
  return poll;
}

type PollSeed = {
  question: string;
  createdAt: Date;
  closedAt?: Date;
  optionLabels?: string[];
  /** 표마다 고른 선택지의 인덱스(참여자는 표마다 새로 만든다) */
  voteOptionIndexes?: number[];
};

// 투표 만들기·표 내기 인터페이스가 생기기 전(티켓 03, 04)까지 쓰는 준비용 헬퍼.
export async function seedPoll(seed: PollSeed): Promise<string> {
  const q = sql();
  const [poll] = await q`
    INSERT INTO polls (question, created_at, closed_at)
    VALUES (${seed.question}, ${seed.createdAt}, ${seed.closedAt ?? null})
    RETURNING id`;
  const labels = seed.optionLabels ?? ["찬성", "반대"];
  const optionIds: string[] = [];
  for (const [position, label] of labels.entries()) {
    const [option] = await q`
      INSERT INTO options (poll_id, label, position)
      VALUES (${poll.id}, ${label}, ${position})
      RETURNING id`;
    optionIds.push(option.id);
  }
  for (const index of seed.voteOptionIndexes ?? []) {
    await q`
      INSERT INTO votes (poll_id, option_id, participant_id)
      VALUES (${poll.id}, ${optionIds[index]}, ${randomUUID()})`;
  }
  return poll.id;
}
