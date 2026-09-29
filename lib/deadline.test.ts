import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { moveDeadlineToPast, resetDb } from "@/test/db";
import { castVote, closePoll, createPoll, getPoll, getResults, listPolls, type Actor } from "@/lib/polls";

beforeEach(resetDb);

const admin: Actor = { isAdmin: true };
const HOUR = 60 * 60 * 1000;
const inHours = (hours: number) => new Date(Date.now() + hours * HOUR);

describe("마감 시각", () => {
  it("마감 시각을 넣어 만든 투표는 그 시각을 가진 진행 중 투표다", async () => {
    const closesAt = new Date(Math.floor(inHours(24).getTime() / 1000) * 1000); // 초 단위로 맞춘다

    const created = await createPoll(admin, "점심 뭐 먹을까요?", ["김밥", "라면"], closesAt);

    if (!created.ok) throw new Error(`만들기 실패: ${JSON.stringify(created)}`);
    const poll = await getPoll(created.pollId);
    expect(poll?.status).toBe("open");
    expect(poll?.closesAt?.toISOString()).toBe(closesAt.toISOString());
  });

  it("지난 시각이나 형식이 틀린 마감 시각은 이유와 함께 거절된다", async () => {
    expect(await createPoll(admin, "질문", ["김밥", "라면"], inHours(-1))).toEqual({
      ok: false,
      reason: "invalid",
      errors: { closesAt: "past" },
    });
    expect(await createPoll(admin, "질문", ["김밥", "라면"], new Date("not a date"))).toEqual({
      ok: false,
      reason: "invalid",
      errors: { closesAt: "invalid" },
    });
    expect(await listPolls()).toEqual([]);
  });

  it("마감 시각이 지난 투표는 운영자가 닫지 않아도 마감이다", async () => {
    const created = await createPoll(admin, "점심 뭐 먹을까요?", ["김밥", "라면"], inHours(1));
    if (!created.ok) throw new Error("만들기 실패");
    const poll = (await getPoll(created.pollId))!;
    await castVote(poll.id, poll.options[0].id, randomUUID());
    await createPoll(admin, "마감 시각 없는 투표", ["a", "b"]);

    await moveDeadlineToPast(poll.id);

    expect((await getPoll(poll.id))?.status).toBe("closed");
    expect(await castVote(poll.id, poll.options[1].id, randomUUID())).toBe("closed");
    // 마감이므로 표를 내지 않은 사람도 결과를 본다.
    expect(await getResults(poll.id, { isAdmin: false })).toMatchObject({
      ok: true,
      results: { status: "closed", totalVotes: 1 },
    });
    // 목록에서 진행 중인 투표 뒤에 온다(더 최근에 만들었어도).
    expect((await listPolls()).map((p) => [p.question, p.status])).toEqual([
      ["마감 시각 없는 투표", "open"],
      ["점심 뭐 먹을까요?", "closed"],
    ]);
  });

  it("마감 시각 전이라도 운영자가 일찍 마감할 수 있다", async () => {
    const created = await createPoll(admin, "점심 뭐 먹을까요?", ["김밥", "라면"], inHours(24));
    if (!created.ok) throw new Error("만들기 실패");

    expect(await closePoll(admin, created.pollId)).toEqual({ ok: true });
    expect((await getPoll(created.pollId))?.status).toBe("closed");
  });

  it("마감 시각을 넣지 않으면 마감 시각이 없다", async () => {
    const created = await createPoll(admin, "점심 뭐 먹을까요?", ["김밥", "라면"]);

    if (!created.ok) throw new Error("만들기 실패");
    expect((await getPoll(created.pollId))?.closesAt).toBeNull();
  });
});
