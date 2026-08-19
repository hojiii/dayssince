/**
 * 기념일 저장.
 *
 * 날짜와 이름만 기기에 담아요. 서버도 로그인도 없어요.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnniversaryCtx } from "../hooks/useAnniversaries";
import type { Anniversary } from "../lib/days";
import { STORAGE_KEYS, loadJson, saveJson } from "../lib/storage";

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AnniversaryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Anniversary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 취소 플래그를 두지 않아요. StrictMode의 두 번째 실행이 첫 실행 결과를 덮어써도
    // 같은 값이라 문제가 없고, 이 Provider는 앱 루트라 언마운트되지 않아요.
    void (async () => {
      const saved = await loadJson<Anniversary[]>(STORAGE_KEYS.anniversaries, []);
      setItems(saved);
      setLoading(false);
    })();
  }, []);

  const persist = useCallback((next: Anniversary[]) => {
    setItems(next);
    void saveJson(STORAGE_KEYS.anniversaries, next);
  }, []);

  const add = useCallback(
    (input: Omit<Anniversary, "id">) => {
      const item: Anniversary = { ...input, id: newId() };
      setItems((prev) => {
        const next = [...prev, item];
        void saveJson(STORAGE_KEYS.anniversaries, next);
        return next;
      });
      return item;
    },
    [],
  );

  const update = useCallback((id: string, input: Omit<Anniversary, "id">) => {
    setItems((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...input, id } : item));
      void saveJson(STORAGE_KEYS.anniversaries, next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      void saveJson(STORAGE_KEYS.anniversaries, next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => persist([]), [persist]);

  const value = useMemo(
    () => ({ items, loading, add, update, remove, clearAll }),
    [items, loading, add, update, remove, clearAll],
  );

  return <AnniversaryCtx.Provider value={value}>{children}</AnniversaryCtx.Provider>;
}
