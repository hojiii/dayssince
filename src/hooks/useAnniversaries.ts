import { createContext, useContext } from "react";
import type { Anniversary } from "../lib/days";

export interface AnniversaryContextValue {
  items: Anniversary[];
  loading: boolean;
  add: (input: Omit<Anniversary, "id">) => Anniversary;
  update: (id: string, input: Omit<Anniversary, "id">) => void;
  remove: (id: string) => void;
  clearAll: () => void;
}

export const AnniversaryCtx = createContext<AnniversaryContextValue | null>(null);

export function useAnniversaries(): AnniversaryContextValue {
  const value = useContext(AnniversaryCtx);
  if (value == null) {
    throw new Error("useAnniversaries는 AnniversaryProvider 안에서만 쓸 수 있어요.");
  }
  return value;
}
