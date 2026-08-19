/**
 * 날짜 계산.
 *
 * 이 앱이 하는 일은 "그날부터 며칠 지났는지" 하나예요. 대신 그 숫자를 여러 각도로
 * 비틀어서 보여줘요 — 시간으로, 분으로, 다음 만 단위까지 남은 날로. 같은 사실인데
 * 단위만 바꿔도 체감이 달라지는 게 이 앱의 재미예요.
 */

export interface Anniversary {
  id: string;
  /** "태어난 날", "이 이어폰" 처럼 사용자가 붙인 이름이에요. */
  label: string;
  /** 기준일 (YYYY-MM-DD) */
  date: string;
  /** 카드에 붙는 이모지예요. 없으면 기본값을 써요. */
  emoji: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** 자정 기준으로 맞춰요. 시각이 섞이면 "며칠째"가 하루씩 흔들려요. */
function atMidnight(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

/**
 * 기준일로부터 며칠째인지 세요.
 *
 * 그날 당일을 1일째로 봐요. "태어난 날이 1일째"가 사람들이 세는 방식이에요.
 * 아직 오지 않은 날이면 0 이하가 나와요.
 */
export function daysSince(date: string, today: Date = new Date()): number {
  const from = atMidnight(parseDate(date));
  const to = atMidnight(today);
  return Math.round((to - from) / DAY_MS) + 1;
}

/** 다음에 도달할 기념 숫자를 찾아요. 100 단위로 끊고, 커지면 1000 단위로 넘어가요. */
export function nextMilestone(days: number): { at: number; remaining: number } {
  const step = days >= 1000 ? 1000 : days >= 100 ? 100 : 10;
  const at = Math.floor(days / step) * step + step;
  return { at, remaining: at - days };
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function weekdayOf(date: string): string {
  return WEEKDAYS[parseDate(date).getDay()];
}

/** 하찮은 환산이에요. 같은 기간을 다른 단위로 바꿔 봐요. */
export interface Trivia {
  label: string;
  value: string;
}

export function triviaFor(days: number, date: string): Trivia[] {
  const hours = days * 24;
  const minutes = hours * 60;
  const years = (days / 365.25).toFixed(1);
  // 평균 심박 70회/분, 하루 세 끼, 하루 8시간 수면으로 잡은 어림값이에요.
  // 정확한 수치가 아니라 "그렇게나 많았나" 싶은 감각을 주려고 넣어요.
  const heartbeats = Math.round(minutes * 70);
  const meals = days * 3;
  const sleptHours = days * 8;
  const moonLaps = (days / 27.3).toFixed(1);

  return [
    { label: "시간으로 세면", value: `${hours.toLocaleString("ko-KR")}시간` },
    { label: "분으로 세면", value: `${minutes.toLocaleString("ko-KR")}분` },
    { label: "햇수로 치면", value: `${years}년` },
    { label: "심장이 뛴 횟수", value: `약 ${heartbeats.toLocaleString("ko-KR")}번` },
    { label: "그동안 먹었을 밥", value: `${meals.toLocaleString("ko-KR")}끼` },
    { label: "잠들어 있던 시간", value: `약 ${sleptHours.toLocaleString("ko-KR")}시간` },
    { label: "달이 지구를 돈 횟수", value: `${moonLaps}바퀴` },
    { label: "시작한 요일", value: `${weekdayOf(date)}요일` },
  ];
}

/** 숫자를 천 단위로 끊어 읽기 좋게 만들어요. */
export function formatDays(days: number): string {
  return days.toLocaleString("ko-KR");
}

/** 아직 오지 않은 날짜인지 봐요. */
export function isFuture(days: number): boolean {
  return days <= 0;
}
