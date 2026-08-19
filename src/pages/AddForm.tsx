/**
 * 기념일 추가 폼.
 *
 * 뭘 넣어야 할지 막막하지 않게 예시를 눌러 채울 수 있게 해요. 이 앱은 "아무 날이나
 * 넣어도 되는 앱"이라 그 감각을 첫 화면에서 알려주는 게 중요해요.
 */

import { useState } from "react";
import type { Anniversary } from "../lib/days";
import "./AddForm.css";

const EMOJIS = ["🎂", "💛", "📱", "🏢", "🐱", "🚗", "✈️", "🏠", "📚", "💪"];

const LABEL_MAX = 14;

interface Props {
  suggestions: { label: string; emoji: string }[];
  onSubmit: (input: Omit<Anniversary, "id">) => void;
  onCancel?: () => void;
}

export function AddForm({ suggestions, onSubmit, onCancel }: Props) {
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  const valid = label.trim() !== "" && date !== "";

  return (
    <main className="page">
      <header className="page-header is-stacked">
        <h1 className="page-title">며칠째</h1>
        <p className="page-sub">아무 날이나 넣어보세요. 하찮을수록 좋아요.</p>
      </header>

      <form
        className="add-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          onSubmit({ label: label.trim(), date, emoji });
        }}
      >
        <div className="field">
          <span className="field-label">뭘 세어볼까요</span>
          <input
            type="text"
            value={label}
            maxLength={LABEL_MAX}
            placeholder="예: 이 이어폰을 산 날"
            onChange={(event) => setLabel(event.target.value)}
          />
          <div className="suggestion-row">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                className="chip"
                onClick={() => {
                  setLabel(suggestion.label);
                  setEmoji(suggestion.emoji);
                }}
              >
                {suggestion.emoji} {suggestion.label}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field-label">그날이 언제였나요</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>

        <div className="field">
          <span className="field-label">이모지</span>
          <div className="emoji-row">
            {EMOJIS.map((candidate) => (
              <button
                key={candidate}
                type="button"
                className={candidate === emoji ? "emoji is-active" : "emoji"}
                aria-pressed={candidate === emoji}
                onClick={() => setEmoji(candidate)}
              >
                {candidate}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={!valid}>
          세어보기
        </button>

        {onCancel != null && (
          <button type="button" className="text-button" onClick={onCancel}>
            취소
          </button>
        )}
      </form>
    </main>
  );
}
