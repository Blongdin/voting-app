import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { createOpenPoll, resetDb } from "@/test/db";
import { castVote, deletePoll, getPoll, getResults, listPolls, type Actor } from "@/lib/polls";

beforeEach(resetDb);

const admin: Actor = { isAdmin: true };

describe("투표 삭제", () => {
  it("운영자가 삭제한 투표는 표와 함께 사라져 목록, 조회, 결과, 표 내기 어디에도 없다", async () => {
    const poll = await createOpenPoll();
    const kept = await createOpenPoll(undefined, "남는 투표");
    await castVote(poll.id, poll.options[0].id, randomUUID());

    expect(await deletePoll(admin, poll.id)).toEqual({ ok: true });

    expect((await listPolls()).map((p) => p.id)).toEqual([kept.id]);
    expect(await getPoll(poll.id)).toBeNull();
    expect(await getResults(poll.id, admin)).toEqual({ ok: false, reason: "not_found" });
    expect(await castVote(poll.id, poll.options[0].id, randomUUID())).toBe("not_found");
  });

  it("운영자가 아니면 삭제할 수 없고 투표는 그대로 남는다", async () => {
    const poll = await createOpenPoll();

    expect(await deletePoll({ isAdmin: false, participantId: randomUUID() }, poll.id)).toEqual({
      ok: false,
      reason: "forbidden",
    });
    expect(await getPoll(poll.id)).not.toBeNull();
  });

  it("없는 투표는 삭제할 수 없다", async () => {
    expect(await deletePoll(admin, randomUUID())).toEqual({ ok: false, reason: "not_found" });
    expect(await deletePoll(admin, "not-a-poll-id")).toEqual({ ok: false, reason: "not_found" });
  });
});
