import type { ReactNode } from "react";
import "./TabBar.css";

export type TabId = "home" | "settings";

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  {
    id: "home",
    label: "며칠째",
    icon: (
      <>
        <rect x="3.2" y="5.4" width="17.6" height="15" rx="2.4" strokeWidth="1.8" />
        <path d="M3.2 10h17.6M8.2 3.4v3.6M15.8 3.4v3.6" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "settings",
    label: "설정",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" strokeWidth="1.9" />
        <path
          d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </>
    ),
  },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tabbar" aria-label="주요 화면">
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            className={selected ? "tabbar-item is-active" : "tabbar-item"}
            aria-current={selected ? "page" : undefined}
            onClick={() => onChange(tab.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              {tab.icon}
            </svg>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
