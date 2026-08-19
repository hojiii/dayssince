/**
 * 보상형 광고.
 *
 * "간식 주기"를 누른 사람에게만 보여줘요. 스스로 누른 광고라 갑자기 튀어나오는
 * 전면 광고와 성격이 달라요 — 이 앱은 하루에 여러 번 여는 앱이라 전면 광고를 넣으면
 * 여는 것 자체가 부담이 되고, 그러면 배너 노출까지 같이 줄어요.
 *
 * 보상은 **`userEarnedReward`를 받았을 때만** 줘요. 광고를 중간에 닫은 사람에게
 * `dismissed`만 보고 지급하면 정책 위반이에요.
 *
 * 참고문서: https://developers-apps-in-toss.toss.im/documentation/common/monetization/iaa/interstitial-rewarded-ad
 */

import { loadFullScreenAd, showFullScreenAd } from "@apps-in-toss/web-framework";
import { useCallback, useEffect, useRef, useState } from "react";
import { ADS_ENABLED } from "../lib/monetization";

/** 개발용 테스트 ID예요. 실 ID로 테스트하면 정책 위반이에요. */
export const TEST_REWARDED_AD_GROUP_ID = "ait-ad-test-rewarded-id";

/** 콘솔에서 발급받은 실제 보상형 광고 그룹 ID예요. */
export const LIVE_REWARDED_AD_GROUP_ID: string | null =
  (import.meta.env.VITE_TOSS_REWARDED_AD_GROUP_ID as string | undefined)?.trim() || null;

function isSupported(): boolean {
  try {
    return loadFullScreenAd.isSupported() && showFullScreenAd.isSupported();
  } catch {
    return false;
  }
}

export function useRewardedAd(adGroupId: string | null) {
  const [ready, setReady] = useState(false);
  const [watching, setWatching] = useState(false);
  // show는 이벤트 핸들러에서 불려서 최신 ready를 state로 읽으면 한 박자 늦어요.
  const readyRef = useRef(false);

  const load = useCallback(() => {
    if (!ADS_ENABLED || adGroupId == null || !isSupported()) return;

    loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        if (event.type === "loaded") {
          readyRef.current = true;
          setReady(true);
        }
      },
      onError: (error) => {
        // 광고를 못 불러와도 앱은 그대로 동작해야 해요. 버튼만 안 보일 뿐이에요.
        console.error("보상형 광고 로드 실패:", error);
      },
    });
  }, [adGroupId]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * 광고를 보여주고, 끝까지 본 경우에만 `onReward`를 불러요.
   *
   * 광고가 닫히면 다음 광고를 미리 받아둬요. 간식을 두 번 줄 수도 있으니까요.
   */
  const show = useCallback(
    (onReward: () => void) => {
      if (!ADS_ENABLED || adGroupId == null || !readyRef.current) return;

      readyRef.current = false;
      setReady(false);
      setWatching(true);

      let earned = false;
      let cleanup: (() => void) | null = null;

      cleanup = showFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          switch (event.type) {
            case "userEarnedReward":
              earned = true;
              break;
            case "dismissed":
            case "failedToShow":
              setWatching(false);
              // 끝까지 본 사람에게만 줘요.
              if (earned) onReward();
              cleanup?.();
              load();
              break;
          }
        },
        onError: (error) => {
          console.error("보상형 광고 노출 실패:", error);
          setWatching(false);
          cleanup?.();
          load();
        },
      });
    },
    [adGroupId, load],
  );

  return { ready, watching, show };
}
