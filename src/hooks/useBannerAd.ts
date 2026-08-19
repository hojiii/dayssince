/**
 * 토스애즈 배너 광고.
 *
 * 배너가 이 앱의 주 수익원이에요. 정책상 배너는 **스크롤 가능한 화면에만**,
 * 그리고 **한 화면에 1개만** 붙일 수 있어요. 인트로·로딩·모달에는 넣지 않아요.
 *
 * 참고문서: https://developers-apps-in-toss.toss.im/documentation/common/monetization/iaa/web-banner
 */

import { TossAds } from "@apps-in-toss/web-framework";
import { useEffect, useRef, useState } from "react";

/** 개발용 테스트 ID예요. 실 ID로 테스트하면 정책 위반이에요. */
export const TEST_BANNER_AD_GROUP_ID = "ait-ad-test-banner-id";

/**
 * 콘솔에서 발급받은 실제 배너 광고 그룹 ID예요. 출시 환경의
 * VITE_TOSS_AD_GROUP_ID로 주입해 앱 번들마다 명확히 구분해요.
 *
 * **테스트 ID를 여기 넣으면 출시 심사에서 반려돼요**
 * — 실제로 한 번 반려된 적 있어요("테스트용 광고 그룹 ID를 넣을 수 없어요").
 */
export const LIVE_BANNER_AD_GROUP_ID: string | null =
  (import.meta.env.VITE_TOSS_AD_GROUP_ID as string | undefined)?.trim() || null;

/**
 * SDK 초기화는 앱 전체에서 **딱 한 번**이어야 해요.
 * 두 번 호출하면 `[toss-ad] Already initialized.` 에러가 나요.
 * StrictMode는 개발 중 effect를 두 번 실행하므로 모듈 수준에서 memo해요.
 */
let initPromise: Promise<boolean> | null = null;

function ensureInitialized(): Promise<boolean> {
  if (initPromise != null) return initPromise;

  initPromise = new Promise<boolean>((resolve) => {
    let supported: boolean;
    try {
      supported = TossAds.initialize.isSupported();
    } catch {
      supported = false;
    }

    if (!supported) {
      resolve(false);
      return;
    }

    TossAds.initialize({
      callbacks: {
        onInitialized: () => resolve(true),
        onInitializationFailed: (error) => {
          console.error("토스애즈 초기화 실패:", error);
          resolve(false);
        },
      },
    });
  });

  return initPromise;
}

interface Options {
  /** true면 배너를 아예 붙이지 않아요. (광고 제거 구매자) */
  disabled?: boolean;
}

/**
 * 반환된 ref를 빈 `div`에 달면 그 자리에 배너가 붙어요.
 * 컨테이너의 width는 항상 100%여야 하고, 고정형은 height 96px을 권장해요.
 */
export function useBannerAd(adGroupId: string, { disabled = false }: Options = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (disabled) return;

    let attached: { destroy: () => void } | undefined;
    let cancelled = false;

    void ensureInitialized().then((ok) => {
      // 초기화를 기다리는 동안 화면이 바뀌었을 수 있어요.
      if (!ok || cancelled || containerRef.current == null) return;

      try {
        attached = TossAds.attachBanner(adGroupId, containerRef.current, {
          theme: "light", // 미니앱은 라이트 모드로만 구현해요.
          tone: "blackAndWhite",
          variant: "expanded",
          callbacks: {
            onAdRendered: () => setRendered(true),
            onNoFill: () => setRendered(false),
            onAdFailedToRender: (payload) => {
              console.error("배너 렌더 실패:", payload.error.message);
              setRendered(false);
            },
          },
        });
      } catch (error) {
        console.error("배너 부착 실패:", error);
      }
    });

    return () => {
      cancelled = true;
      // 언마운트 시 반드시 정리해야 메모리 누수가 없어요.
      attached?.destroy();
      setRendered(false);
    };
  }, [adGroupId, disabled]);

  return { containerRef, rendered };
}
