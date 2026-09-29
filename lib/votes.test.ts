import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { markClosed, resetDb } from "@/test/db";
import { castVote, createPoll, getPoll, getResults, type Actor, type Poll } from "@/lib/polls";

beforeEach(resetDb);

const admin: Actor = { isAdmin: true };
const participant = (): Actor => ({ isAdmin: false, participantId: randomUUID() });

async function pollWith(optionLabels: string[]): Promise<Poll> {
  const created = await createPoll(admin, "점심 뭐 먹을까요?", optionLabels);
  if (!created.ok) throw new Error("테스트 준비: 투표 만들기 실패");
  const poll = await getPoll(created.pollId);
  if (!poll) throw new Error("테스트 준비: 투표 조회 실패");
  return poll;
}

describe("표 내기", () => {
  it("표를 내면 결과에 반영되고, 낸 참여자는 자기가 고른 선택지를 본다", async () => {
    const poll = await pollWith(["김밥", "라면"]);
    const me = participant();

    expect(await castVote(poll.id, poll.options[1].id, me.participantId!)).toBe("ok");

    const results = await getResults(poll.id, me);
    expect(results).toMatchObject({
      ok: true,
      results: {
        status: "open",
        totalVotes: 1,
        myOptionId: poll.options[1].id,
        options: [
          { id: poll.options[0].id, label: "김밥", votes: 0 },
          { id: poll.options[1].id, label: "라면", votes: 1 },
        ],
      },
    });
  });

  it("같은 참여자가 다시 표를 내면 이미 표를 냄이 되고 표 수는 변하지 않는다", async () => {
    const poll = await pollWith(["김밥", "라면"]);
    const me = participant();
    await castVote(poll.id, poll.options[0].id, me.participantId!);

    expect(await castVote(poll.id, poll.options[1].id, me.participantId!)).toBe("already_voted");

    const results = await getResults(poll.id, me);
    expect(results).toMatchObject({
      results: { totalVotes: 1, myOptionId: poll.options[0].id },
    });
  });

  it("같은 참여자의 표 두 개를 동시에 보내도 하나만 들어간다", async () => {
    const poll = await pollWith(["김밥", "라면"]);
    const me = participant();

    const outcomes = await Promise.all([
      castVote(poll.id, poll.options[0].id, me.participantId!),
      castVote(poll.id, poll.options[1].id, me.participantId!),
    ]);

    expect(outcomes.sort()).toEqual(["already_voted", "ok"]);
    expect(await getResults(poll.id, admin)).toMatchObject({ results: { totalVotes: 1 } });
  });

  it("다른 투표의 선택지로는 표를 낼 수 없다", async () => {
    const poll = await pollWith(["김밥", "라면"]);
    const other = await pollWith(["짜장", "짬뽕"]);

    expect(await castVote(poll.id, other.options[0].id, participant().participantId!)).toBe(
      "invalid_option",
    );
    expect(await getResults(poll.id, admin)).toMatchObject({ results: { totalVotes: 0 } });
    expect(await getResults(other.id, admin)).toMatchObject({ results: { totalVotes: 0 } });
  });

  it("마감된 투표에는 표를 낼 수 없다", async () => {
    const poll = await pollWith(["김밥", "라면"]);
    await markClosed(poll.id);

    expect(await castVote(poll.id, poll.options[0].id, participant().participantId!)).toBe("closed");
    expect(await getResults(poll.id, admin)).toMatchObject({ results: { totalVotes: 0 } });
  });

  it("없는 투표에는 표를 낼 수 없다", async () => {
    const poll = await pollWith(["김밥", "라면"]);
    const someone = participant().participantId!;

    expect(await castVote(randomUUID(), poll.options[0].id, someone)).toBe("not_found");
    expect(await castVote("not-a-poll-id", poll.options[0].id, someone)).toBe("not_found");
    expect(await castVote(poll.id, "not-an-option-id", someone)).toBe("invalid_option");
  });
});

describe("결과 조회", () => {
  it("진행 중인 투표의 결과는 표를 내지 않은 참여자와 참여자 ID가 없는 사람에게 보이지 않는다", async () => {
    const poll = await pollWith(["김밥", "라면"]);
    await castVote(poll.id, poll.options[0].id, participant().participantId!);

    expect(await getResults(poll.id, participant())).toEqual({ ok: false, reason: "forbidden" });
    expect(await getResults(poll.id, { isAdmin: false })).toEqual({ ok: false, reason: "forbidden" });
  });

  it("운영자는 표를 내지 않아도 진행 중인 투표의 결과를 본다", async () => {
    const poll = await pollWith(["김밥", "라면"]);
    await castVote(poll.id, poll.options[0].id, participant().participantId!);

    expect(await getResults(poll.id, admin)).toMatchObject({
      ok: true,
      results: { totalVotes: 1, myOptionId: null },
    });
  });

  it("마감된 투표의 결과는 누구나 본다", async () => {
    const poll = await pollWith(["김밥", "라면"]);
    await castVote(poll.id, poll.options[0].id, participant().participantId!);
    await markClosed(poll.id);

    for (const viewer of [participant(), { isAdmin: false }]) {
      expect(await getResults(poll.id, viewer)).toMatchObject({
        ok: true,
        results: { status: "closed", totalVotes: 1 },
      });
    }
  });

  it("선택지마다 표 수와 반올림한 정수 비율을 표시 순서대로 담는다", async () => {
    const poll = await pollWith(["김밥", "라면", "우동"]);
    for (const option of [poll.options[0], poll.options[0], poll.options[1]]) {
      await castVote(poll.id, option.id, participant().participantId!);
    }

    const results = await getResults(poll.id, admin);

    expect(results.ok && results.results.options.map((o) => [o.label, o.votes, o.percent])).toEqual([
      ["김밥", 2, 67],
      ["라면", 1, 33],
      ["우동", 0, 0],
    ]);
  });

  it("표가 없으면 모든 비율이 0이다", async () => {
    const poll = await pollWith(["김밥", "라면"]);

    const results = await getResults(poll.id, admin);

    expect(results.ok && results.results.totalVotes).toBe(0);
    expect(results.ok && results.results.options.map((o) => o.percent)).toEqual([0, 0]);
  });

  it("없는 투표의 결과는 없음이다", async () => {
    expect(await getResults(randomUUID(), admin)).toEqual({ ok: false, reason: "not_found" });
    expect(await getResults("not-a-poll-id", admin)).toEqual({ ok: false, reason: "not_found" });
  });
});
