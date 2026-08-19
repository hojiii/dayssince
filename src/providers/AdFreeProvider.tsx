/**
 * 광고 제거(비소모품) 인앱 결제.
 *
 * 심사 기준에 "기기를 변경해도 결제 데이터가 유지돼야 한다"가 있어요.
 * 서버 없이 `IAP.getCompletedOrRefundedOrders()`로 구매 이력을 조회해서 복원해요.
 * 같은 토스 계정이면 새 기기에서도 이력이 그대로 조회돼요.
 *
 * 참고문서: https://developers-apps-in-toss.toss.im/documentation/common/monetization/iap/in-app-purchase
 */

import { IAP } from "@apps-in-toss/web-framework";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ADFREE_SKU, AdFreeContext, IAP_READY } from "../hooks/useAdFree";
import { STORAGE_KEYS, loadJson, saveJson } from "../lib/storage";

/** IAP를 쓸 수 있는 환경인지예요. 미지원 버전에서는 `IAP` 자체가 undefined예요. */
function isIapAvailable() {
  if (!IAP_READY) return false;

  try {
    return IAP?.getCompletedOrRefundedOrders?.isSupported() === true;
  } catch {
    return false;
  }
}

/**
 * 구매 이력에 광고 제거가 있는지 확인해요. 환불된 건은 제외해요.
 *
 * 응답은 한 페이지에 50건인데 이 앱이 파는 상품은 광고 제거 하나뿐이라
 * 첫 페이지 밖으로 밀려날 일이 없어서 페이지네이션을 하지 않아요.
 */
async function hasPurchasedAdFree(): Promise<boolean> {
  const result = await IAP.getCompletedOrRefundedOrders();
  if (result == null) return false;

  return result.orders.some(
    (order) => order.sku === ADFREE_SKU && order.status === "COMPLETED",
  );
}

/** 결제는 됐는데 지급이 안 된 주문을 마저 처리해요. */
async function settlePendingOrders(): Promise<boolean> {
  const pending = await IAP.getPendingOrders();
  const orders = pending?.orders ?? [];
  let granted = false;

  for (const order of orders) {
    if (order.sku !== ADFREE_SKU) continue;

    await IAP.completeProductGrant({ params: { orderId: order.orderId } });
    granted = true;
  }
  return granted;
}

export function AdFreeProvider({ children }: { children: ReactNode }) {
  const [adFree, setAdFree] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const grant = useCallback(() => {
    setAdFree(true);
    void saveJson(STORAGE_KEYS.adFree, true);
  }, []);

  const restore = useCallback(async () => {
    if (!isIapAvailable()) return;

    try {
      // 미결 주문을 먼저 정리해야 구매 이력에 잡혀요.
      if (await settlePendingOrders()) {
        grant();
        return;
      }

      const owned = await hasPurchasedAdFree();
      setAdFree(owned);
      void saveJson(STORAGE_KEYS.adFree, owned);
    } catch (error) {
      // 복원에 실패해도 캐시된 상태를 유지해요. 구매자에게 갑자기 광고를 띄우지 않기 위해서예요.
      console.error("구매 복원 실패:", error);
    }
  }, [grant]);

  useEffect(() => {
    if (!IAP_READY) return;

    let cancelled = false;

    (async () => {
      // 1) 캐시를 먼저 반영해서 광고가 깜빡이지 않게 해요.
      const cached = await loadJson<boolean>(STORAGE_KEYS.adFree, false);
      if (cancelled) return;
      if (cached) setAdFree(true);

      // 2) 실제 구매 이력으로 맞춰요.
      await restore();
    })();

    return () => {
      cancelled = true;
    };
  }, [restore]);

  const purchase = useCallback(() => {
    if (!isIapAvailable() || ADFREE_SKU == null) {
      alert("인앱 결제는 토스 앱에서만 이용할 수 있어요.");
      return;
    }

    setPurchasing(true);

    try {
      const cleanup = IAP.createOneTimePurchaseOrder({
        options: {
          sku: ADFREE_SKU,
          // 여기서 true를 돌려주지 않으면 사용자에게 환불 안내 화면이 떠요.
          processProductGrant: () => {
            grant();
            return true;
          },
        },
        onEvent: (event) => {
          if (event.type === "success") {
            grant();
          }
          setPurchasing(false);
          cleanup();
        },
        onError: (error) => {
          console.error("결제 실패:", error);
          setPurchasing(false);
          cleanup();
        },
      });
    } catch (error) {
      console.error("결제 실패:", error);
      setPurchasing(false);
    }
  }, [grant]);

  return (
    <AdFreeContext.Provider value={{ adFree, purchasing, purchase, restore }}>
      {children}
    </AdFreeContext.Provider>
  );
}
