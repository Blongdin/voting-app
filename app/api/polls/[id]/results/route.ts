import { isAdmin } from "@/lib/admin-session";
import { participantActor } from "@/lib/participant";
import { getResults } from "@/lib/polls";

// 결과 조회 API. 결과 공개 규칙은 도메인 모듈의 getResults를 그대로 따른다.
// 참여자 화면과 운영자 화면이 5초마다 호출한다.
export async function GET(_request: Request, ctx: RouteContext<"/api/polls/[id]/results">) {
  const { id } = await ctx.params;
  const viewer = { ...(await participantActor()), isAdmin: await isAdmin() };

  const result = await getResults(id, viewer);
  const headers = { "Cache-Control": "no-store" };
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 403;
    return Response.json({ error: result.reason }, { status, headers });
  }
  return Response.json(result.results, { headers });
}
