import { sql } from "@/lib/db";

export type PollStatus = "open" | "closed";

export type PollSummary = {
  id: string;
  question: string;
  status: PollStatus;
  totalVotes: number;
  createdAt: Date;
};

export async function listPolls(): Promise<PollSummary[]> {
  const rows = await sql()`
    SELECT p.id, p.question, p.created_at, p.closed_at, count(v.id)::int AS total_votes
    FROM polls p
    LEFT JOIN votes v ON v.poll_id = p.id
    GROUP BY p.id
    ORDER BY p.closed_at IS NOT NULL, p.created_at DESC`;
  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    status: row.closed_at ? "closed" : "open",
    totalVotes: row.total_votes,
    createdAt: new Date(row.created_at),
  }));
}
