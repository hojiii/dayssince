import { describe, expect, it } from "vitest";
import { daysSince, isFuture, nextMilestone, triviaFor, weekdayOf } from "./days";

const TODAY = new Date("2026-08-19T12:00:00");

describe("daysSince", () => {
  it("기준일 당일은 1일째예요", () => {
    expect(daysSince("2026-08-19", TODAY)).toBe(1);
  });

  it("하루 지나면 2일째예요", () => {
    expect(daysSince("2026-08-18", TODAY)).toBe(2);
  });

  it("시각이 달라도 날짜 기준으로만 세요", () => {
    // 자정 직전과 정오가 같은 날로 나와야 해요.
    expect(daysSince("2026-08-01", new Date("2026-08-19T23:59:00"))).toBe(
      daysSince("2026-08-01", new Date("2026-08-19T00:01:00")),
    );
  });

  it("아직 오지 않은 날은 0 이하예요", () => {
    expect(daysSince("2026-08-25", TODAY)).toBeLessThanOrEqual(0);
    expect(isFuture(daysSince("2026-08-25", TODAY))).toBe(true);
  });

  it("해를 넘겨도 맞게 세요", () => {
    // 2025-08-19 부터 2026-08-19 까지는 365일 + 당일
    expect(daysSince("2025-08-19", TODAY)).toBe(366);
  });
});

describe("nextMilestone", () => {
  it("100일 미만은 10 단위로 끊어요", () => {
    expect(nextMilestone(37)).toEqual({ at: 40, remaining: 3 });
  });

  it("100일 넘으면 100 단위로 끊어요", () => {
    expect(nextMilestone(412)).toEqual({ at: 500, remaining: 88 });
  });

  it("1000일 넘으면 1000 단위로 끊어요", () => {
    expect(nextMilestone(9132)).toEqual({ at: 10000, remaining: 868 });
  });

  it("딱 맞아떨어지는 날에도 다음 것을 알려줘요", () => {
    // 오늘이 100일이면 남은 건 0이 아니라 다음 목표여야 해요.
    expect(nextMilestone(100)).toEqual({ at: 200, remaining: 100 });
  });
});

describe("weekdayOf", () => {
  it("그날의 요일을 알려줘요", () => {
    // 2026-08-19 는 수요일이에요.
    expect(weekdayOf("2026-08-19")).toBe("수");
  });
});

describe("triviaFor", () => {
  it("같은 기간을 여러 단위로 바꿔줘요", () => {
    const trivia = triviaFor(100, "2026-05-12");
    const hours = trivia.find((item) => item.label === "시간으로 세면");

    expect(hours?.value).toBe("2,400시간");
  });

  it("항목이 비지 않아요", () => {
    expect(triviaFor(1, "2026-08-19").length).toBeGreaterThan(3);
  });
});
