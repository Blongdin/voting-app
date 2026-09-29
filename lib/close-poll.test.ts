import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { createOpenPoll, resetDb } from "@/test/db";
import { castVote, closePoll, getPoll, listPolls, type Actor } from "@/lib/polls";

beforeEach(resetDb);

const admin: Actor = { isAdmin: true };

describe("투표 마감", () => {
  it("운영자가 마감한 투표는 마감 상태가 되고 더는 표를 받지 않는다", async () => {
    const poll = await createOpenPoll();

    expect(await closePoll(admin, poll.id)).toEqual({ ok: true });

    expect((await getPoll(poll.id))?.status).toBe("closed");
    expect(await castVote(poll.id, poll.options[0].id, randomUUID())).toBe("closed");
  });

  it("운영자가 아니면 마감할 수 없고 투표는 진행 중으로 남는다", async () => {
    const poll = await createOpenPoll();

    expect(await closePoll({ isAdmin: false, participantId: randomUUID() }, poll.id)).toEqual({
      ok: false,
      reason: "forbidden",
    });
    expect((await getPoll(poll.id))?.status).toBe("open");
  });

  it("이미 마감된 투표를 다시 마감해도 아무것도 바뀌지 않는다", async () => {
    const poll = await createOpenPoll();
    await closePoll(admin, poll.id);

    expect(await closePoll(admin, poll.id)).toEqual({ ok: true });
    expect((await getPoll(poll.id))?.status).toBe("closed");
  });

  it("없는 투표는 마감할 수 없다", async () => {
    expect(await closePoll(admin, randomUUID())).toEqual({ ok: false, reason: "not_found" });
    expect(await closePoll(admin, "not-a-poll-id")).toEqual({ ok: false, reason: "not_found" });
  });

  it("마감된 투표는 목록에서 진행 중인 투표 뒤에 온다", async () => {
    await createOpenPoll(undefined, "먼저 만든 투표");
    const newer = await createOpenPoll(undefined, "나중에 만든 투표");

    await closePoll(admin, newer.id);

    expect((await listPolls()).map((p) => [p.question, p.status])).toEqual([
      ["먼저 만든 투표", "open"],
      ["나중에 만든 투표", "closed"],
    ]);
  });
});
