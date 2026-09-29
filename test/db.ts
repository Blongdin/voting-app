import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";

// 테스트마다 테스트 DB를 비운다.
export async function resetDb() {
  await sql()`TRUNCATE polls, options, votes CASCADE`;
}

type SeedPoll = {
  question: string;
  createdAt: Date;
  closedAt?: Date;
  options?: string[];
  /** 선택지 인덱스마다 표 하나(참여자는 매번 새로 만든다) */
  votes?: number[];
};

// 투표 만들기·표 내기 인터페이스가 생기기 전(티켓 03, 04)까지 쓰는 준비용 헬퍼.
export async function seedPoll(seed: SeedPoll): Promise<string> {
  const q = sql();
  const [poll] = await q`
    INSERT INTO polls (question, created_at, closed_at)
    VALUES (${seed.question}, ${seed.createdAt}, ${seed.closedAt ?? null})
    RETURNING id`;
  const labels = seed.options ?? ["찬성", "반대"];
  const optionIds: string[] = [];
  for (const [position, label] of labels.entries()) {
    const [option] = await q`
      INSERT INTO options (poll_id, label, position)
      VALUES (${poll.id}, ${label}, ${position})
      RETURNING id`;
    optionIds.push(option.id);
  }
  for (const index of seed.votes ?? []) {
    await q`
      INSERT INTO votes (poll_id, option_id, participant_id)
      VALUES (${poll.id}, ${optionIds[index]}, ${randomUUID()})`;
  }
  return poll.id;
}
