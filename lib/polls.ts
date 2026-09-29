import { sql } from "@/lib/db";

export type PollStatus = "open" | "closed";

export type PollSummary = {
  id: string;
  question: string;
  status: PollStatus;
  totalVotes: number;
};

export async function listPolls(): Promise<PollSummary[]> {
  const rows = await sql()`
    SELECT p.id, p.question, p.closed_at IS NOT NULL AS closed, count(v.id)::int AS total_votes
    FROM polls p
    LEFT JOIN votes v ON v.poll_id = p.id
    GROUP BY p.id
    ORDER BY closed, p.created_at DESC, p.id`;
  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    status: row.closed ? "closed" : "open",
    totalVotes: row.total_votes,
  }));
}
