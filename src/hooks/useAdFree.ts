/**
 * 광고 제거(비소모품) 구매 상태의 컨텍스트와 훅이에요.
 * 실제 결제·복원 로직은 `providers/AdFreeProvider.tsx`에 있어요.
 */

import { createContext, useContext } from "react";
import { IAP_ENABLED } from "../lib/monetization";

/**
 * 콘솔에 상품을 등록하면 발급되는 productId예요. 직접 지어낼 수 없고,
 * 여기 값이 콘솔의 상품과 다르면 결제창이 뜨지 않아요.
 */
export const ADFREE_SKU: string | null =
  (import.meta.env.VITE_ADFREE_SKU as string | undefined)?.trim() || null;

/**
 * 결제를 실제로 노출해도 되는 상태인지예요.
 *
 * 플래그만 켜고 SKU가 비어 있으면 "눌러도 아무 일도 안 나는 구매 버튼"이 돼서
 * 심사에서 반려돼요. 둘 다 갖춰졌을 때만 켜요.
 */
export const IAP_READY = IAP_ENABLED && ADFREE_SKU != null;

/**
 * 화면에 보여줄 가격이에요. 콘솔 상품의 정산가는 1,900원이고 여기 적는 값은
 * 사용자가 실제로 내는 부가세 포함 금액이에요. 콘솔에서 가격을 바꾸면 여기도 같이 고쳐야 해요.
 */
export const ADFREE_PRICE_LABEL = "2,090원";

export interface AdFreeState {
  /** 광고를 제거한 사용자인지예요. */
  adFree: boolean;
  /** 결제창이 떠 있는 중인지예요. */
  purchasing: boolean;
  purchase: () => void;
  /** 구매 이력을 다시 조회해요. (설정의 "구매 복원") */
  restore: () => Promise<void>;
}

export const AdFreeContext = createContext<AdFreeState | null>(null);

export function useAdFree(): AdFreeState {
  const value = useContext(AdFreeContext);
  if (value == null) {
    throw new Error("useAdFree는 AdFreeProvider 안에서만 쓸 수 있어요.");
  }
  return value;
}
