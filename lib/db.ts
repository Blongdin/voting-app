import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | undefined;

// 첫 쿼리 때 연결을 만든다. 빌드 시점에 DATABASE_URL이 없어도 import는 실패하지 않는다.
export function sql(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL이 설정되지 않았습니다.");
    client = neon(url);
  }
  return client;
}
