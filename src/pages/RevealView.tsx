/**
 * 결과 공개 화면.
 *
 * 계산은 즉시 끝나지만 **한 번에 다 보여주지 않아요.** 이름 → 숫자 → 다음 목표 →
 * 더 알아보기 순으로 하나씩 올라와요. 같은 정보라도 한꺼번에 쏟으면 그냥 표가 되고,
 * 하나씩 나오면 "얼마나 됐지?"를 기다리는 시간이 생겨요. 그 기다림이 이 앱의 재미예요.
 *
 * 큰 숫자는 0부터 세어 올라가요. 숫자가 굴러가는 동안이 제일 두근거리는 구간이라
 * 여기에만 시간을 좀 더 써요.
 */

import { useEffect, useRef, useState } from "react";
import { BannerSlot } from "../components/BannerSlot";
import { useAdFree } from "../hooks/useAdFree";
import { LIVE_REWARDED_AD_GROUP_ID, useRewardedAd } from "../hooks/useRewardedAd";
import {
  daysSince,
  formatDays,
  isFuture,
  nextMilestone,
  triviaFor,
  type Anniversary,
} from "../lib/days";
import "./RevealView.css";

/** 각 단계가 등장하는 시각(밀리초)이에요. */
const STEP_AT = [0, 420, 1500, 2100];

/** 숫자가 0에서 목표까지 굴러가는 시간이에요. */
const COUNT_MS = 1000;

function useCountUp(target: number, start: boolean): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;

    // 움직임을 줄이도록 설정한 사용자에게는 굴리지 않고 바로 보여줘요.
    // 다음 프레임에 넘기는 건 effect 본문에서 곧바로 setState 하지 않기 위해서예요.
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) {
      frame.current = requestAnimationFrame(() => setValue(target));
      return () => {
        if (frame.current != null) cancelAnimationFrame(frame.current);
      };
    }

    // 시작 시각을 첫 프레임에서 잡아요. requestAnimationFrame 이 주는 타임스탬프는
    // "프레임이 시작된 시각"이라 여기서 performance.now() 로 미리 잡아두면 그보다
    // 앞선 값이 들어올 수 있어요. 그러면 진행도가 음수가 되고, 3제곱 보간을 타고
    // 숫자가 목표의 반대편으로 크게 튀어요. 실제로 -16,189 가 찍힌 적이 있어요.
    let began: number | null = null;

    const tick = (now: number) => {
      began ??= now;
      const progress = Math.min(Math.max((now - began) / COUNT_MS, 0), 1);
      // 끝으로 갈수록 느려지면 숫자가 "착지"하는 느낌이 나요.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, [target, start]);

  return value;
}

export function RevealView({ item, onBack }: { item: Anniversary; onBack: () => void }) {
  const { adFree } = useAdFree();
  const [step, setStep] = useState(0);
  const [triviaOpen, setTriviaOpen] = useState(false);

  const days = daysSince(item.date);
  const future = isFuture(days);
  const milestone = nextMilestone(days);
  const counted = useCountUp(days, step >= 2);

  const rewarded = useRewardedAd(adFree ? null : LIVE_REWARDED_AD_GROUP_ID);

  useEffect(() => {
    const timers = STEP_AT.map((at, index) =>
      window.setTimeout(() => setStep(index + 1), at),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [item.id]);

  return (
    <main className="page">
      <header className="page-header">
        <button type="button" className="text-button" onClick={onBack}>
          ← 목록
        </button>
      </header>

      <div className="reveal">
        <div className={step >= 1 ? "reveal-step is-in" : "reveal-step"}>
          <p className="reveal-emoji">{item.emoji}</p>
          <p className="reveal-label">{item.label}</p>
        </div>

        <div className={step >= 2 ? "reveal-step is-in" : "reveal-step"}>
          {future ? (
            <p className="reveal-days">아직이에요</p>
          ) : (
            <p className="reveal-days">
              <span className="reveal-number">{formatDays(counted)}</span>
              <span className="reveal-unit">일째</span>
            </p>
          )}
          <p className="reveal-from">{item.date}부터</p>
        </div>

        {!future && (
          <div className={step >= 3 ? "reveal-step is-in" : "reveal-step"}>
            <div className="reveal-next">
              <span className="reveal-next-label">다음 기념일까지</span>
              <span className="reveal-next-value">
                {formatDays(milestone.at)}일 · D-{formatDays(milestone.remaining)}
              </span>
            </div>
          </div>
        )}

        {!future && !triviaOpen && (
          <div className={step >= 4 ? "reveal-step is-in" : "reveal-step"}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={rewarded.watching}
              onClick={() => {
                // 광고를 볼 수 있으면 보고 열고, 아니면 그냥 열어요. 부가 정보라
                // 광고가 안 뜨는 환경에서 영영 못 보게 막을 이유는 없어요.
                if (rewarded.ready) {
                  rewarded.show(() => setTriviaOpen(true));
                } else {
                  setTriviaOpen(true);
                }
              }}
            >
              {rewarded.watching
                ? "불러오는 중…"
                : rewarded.ready
                  ? "광고 보고 더 알아보기"
                  : "더 알아보기"}
            </button>
          </div>
        )}

        {triviaOpen && (
          <ul className="trivia">
            {triviaFor(days, item.date).map((row, index) => (
              <li
                key={row.label}
                className="trivia-row"
                // 목록도 한 줄씩 흘러들어와요.
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <span className="trivia-label">{row.label}</span>
                <span className="trivia-value">{row.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BannerSlot />
    </main>
  );
}
