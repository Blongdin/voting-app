// 화면에 보여 주는 날짜·시간 형식. 서버가 어느 지역에 있든 한국 시간으로 보여 준다.

const deadlineFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** 예: "10월 3일 18:00 마감" */
export function formatDeadline(closesAt: Date): string {
  const parts = Object.fromEntries(deadlineFormat.formatToParts(closesAt).map((p) => [p.type, p.value]));
  return `${parts.month} ${parts.day}일 ${parts.hour}:${parts.minute} 마감`;
}
