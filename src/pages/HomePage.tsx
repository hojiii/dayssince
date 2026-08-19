/**
 * 기념일 목록 화면.
 *
 * 등록한 날짜들이 며칠째인지 한눈에 보여줘요. 카드를 누르면 그 항목만
 * 공개 연출과 함께 크게 보여주는 화면으로 들어가요.
 */

import { useState } from "react";
import { BannerSlot } from "../components/BannerSlot";
import { useAdFree } from "../hooks/useAdFree";
import { useAnniversaries } from "../hooks/useAnniversaries";
import { LIVE_INTERSTITIAL_AD_GROUP_ID, useInterstitialAd } from "../hooks/useInterstitialAd";
import { daysSince, formatDays, isFuture, type Anniversary } from "../lib/days";
import { AddForm } from "./AddForm";
import { RevealView } from "./RevealView";
import "./HomePage.css";

/** 목록 / 추가 폼 / 결과 공개 중 무엇을 보여줄지예요. */
type View = { name: "list" } | { name: "add" } | { name: "reveal"; id: string };

const SUGGESTIONS: { label: string; emoji: string }[] = [
  { label: "태어난 날", emoji: "🎂" },
  { label: "우리가 만난 날", emoji: "💛" },
  { label: "이 폰을 산 날", emoji: "📱" },
  { label: "회사에 들어온 날", emoji: "🏢" },
];

export function HomePage() {
  const { items, loading, add } = useAnniversaries();
  const { adFree } = useAdFree();
  const [view, setView] = useState<View>({ name: "list" });

  // 추가 폼에 머무는 동안 전면 광고를 미리 받아둬요. 폼 화면에는 배너가 없어서
  // 배너와 전면을 동시에 로드할 때 생기는 안드로이드 이슈도 함께 피해가요.
  const interstitial = useInterstitialAd(adFree ? null : LIVE_INTERSTITIAL_AD_GROUP_ID, {
    preload: view.name === "add",
  });

  if (loading) {
    return (
      <main className="page">
        <p className="muted">불러오는 중이에요…</p>
      </main>
    );
  }

  if (view.name === "add") {
    return (
      <AddForm
        suggestions={SUGGESTIONS}
        onCancel={items.length === 0 ? undefined : () => setView({ name: "list" })}
        onSubmit={(input) => {
          const created = add(input);
          // 결과 화면으로 먼저 넘긴 다음 그 위에 광고를 덮어요. 광고를 닫으면
          // 공개 연출이 이어져요. 광고가 준비되지 않았으면 그냥 연출만 보여요.
          setView({ name: "reveal", id: created.id });
          interstitial.show();
        }}
      />
    );
  }

  if (view.name === "reveal") {
    const item = items.find((candidate) => candidate.id === view.id);
    if (item != null) {
      return <RevealView item={item} onBack={() => setView({ name: "list" })} />;
    }
  }

  if (items.length === 0) {
    return (
      <AddForm
        suggestions={SUGGESTIONS}
        onSubmit={(input) => {
          const created = add(input);
          setView({ name: "reveal", id: created.id });
          interstitial.show();
        }}
      />
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">며칠째</h1>
        <button type="button" className="text-button" onClick={() => setView({ name: "add" })}>
          + 추가
        </button>
      </header>

      <div className="day-list">
        {items.map((item) => (
          <DayCard key={item.id} item={item} onOpen={() => setView({ name: "reveal", id: item.id })} />
        ))}
      </div>

      <BannerSlot />
    </main>
  );
}

function DayCard({ item, onOpen }: { item: Anniversary; onOpen: () => void }) {
  const days = daysSince(item.date);

  return (
    <button type="button" className="day-card" onClick={onOpen}>
      <span className="day-emoji">{item.emoji}</span>
      <span className="day-body">
        <span className="day-label">{item.label}</span>
        <span className="day-date">{item.date}</span>
      </span>
      <span className="day-count">
        {isFuture(days) ? "아직" : `${formatDays(days)}일째`}
      </span>
    </button>
  );
}
