/**
 * 전면 광고.
 *
 * 조회(아이 추가·정보 수정)를 마친 뒤 **로딩 화면 위에** 띄워요. 광고가 갑자기 튀어나오지
 * 않고 "조회 중"이라는 맥락 안에서 등장하도록, 결과를 계산하는 동안 보여주는 로딩 화면
 * 다음에 붙여요. 정책의 "광고가 예상하지 못한 순간에 등장해서는 안 됨"을 이렇게 지켜요.
 *
 * 입력 폼에 머무는 동안 미리 로드해두기 때문에 사용자가 광고를 기다리지 않아요.
 * 로드는 1~2초(토스 애즈)에서 최대 60초(애드몹)까지 걸릴 수 있어서 미리 로드가 중요해요.
 *
 * 참고문서: https://developers-apps-in-toss.toss.im/documentation/common/monetization/iaa/interstitial-rewarded-ad
 */

import { loadFullScreenAd, showFullScreenAd } from "@apps-in-toss/web-framework";
import { useCallback, useEffect, useRef, useState } from "react";
import { ADS_ENABLED } from "../lib/monetization";
import { STORAGE_KEYS, loadJson, saveJson } from "../lib/storage";

/** 개발용 테스트 ID예요. 실 ID로 테스트하면 정책 위반이에요. */
export const TEST_INTERSTITIAL_AD_GROUP_ID = "ait-ad-test-interstitial-id";

/** 콘솔에서 발급받은 실제 전면 광고 그룹 ID예요. */
export const LIVE_INTERSTITIAL_AD_GROUP_ID: string | null =
  (import.meta.env.VITE_TOSS_INTERSTITIAL_AD_GROUP_ID as string | undefined)?.trim() || null;

/**
 * 직전 노출로부터 이만큼은 다시 띄우지 않아요.
 *
 * 조회할 때마다 띄우는 게 기본이지만, 생년월일을 잘못 넣어 고치거나 조건을 바꿔보며
 * 연달아 조회하는 탐색 단계에서 광고가 연속으로 뜨면 그대로 이탈해요. 그 구간만 막아요.
 */
const COOLDOWN_MS = 3 * 60 * 1000;

async function isCoolingDown(): Promise<boolean> {
  const last = await loadJson<number>(STORAGE_KEYS.lastInterstitialAt, 0);
  return Date.now() - last < COOLDOWN_MS;
}

function isSupported(): boolean {
  try {
    return loadFullScreenAd.isSupported() && showFullScreenAd.isSupported();
  } catch {
    return false;
  }
}

interface Options {
  /** 광고를 미리 로드해둘 조건이에요. 정보 수정 화면에 있을 때만 true로 주세요. */
  preload: boolean;
}

/**
 * @param adGroupId 콘솔에서 발급받은 전면 광고 그룹 ID예요. 없으면 아무것도 하지 않아요.
 */
export function useInterstitialAd(adGroupId: string | null, { preload }: Options) {
  const [ready, setReady] = useState(false);
  // show는 이벤트 핸들러에서 불려서 최신 ready를 state로 읽으면 한 박자 늦어요.
  const readyRef = useRef(false);

  useEffect(() => {
    if (!ADS_ENABLED || !preload || adGroupId == null) return;
    if (!isSupported()) return;

    let unregister: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      if (await isCoolingDown()) return;
      if (cancelled) return;

      unregister = loadFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === "loaded") {
            readyRef.current = true;
            setReady(true);
          }
        },
        onError: (error) => {
          // 광고를 못 불러와도 앱은 그대로 동작해야 해요. 조용히 넘어가요.
          console.error("전면 광고 로드 실패:", error);
        },
      });
    })();

    return () => {
      cancelled = true;
      unregister?.();
    };
  }, [adGroupId, preload]);

  /**
   * 미리 로드해둔 광고를 띄워요.
   *
   * 광고가 준비되지 않았으면 **아무것도 하지 않고 그냥 넘어가요.** 광고를 기다리느라
   * 결과 화면이 늦게 뜨면 안 되니까요. 호출한 쪽은 광고 여부와 상관없이 화면을 바꾸면 돼요.
   *
   * 호출하기 **전에** 결과 화면으로 바꿔두세요. 광고는 그 위를 덮는 형태라, 닫는 순간
   * 결과가 바로 보여요. 안드로이드 일부 버전에서 `dismissed` 이벤트가 오지 않는 이슈가
   * 있어서, 광고가 닫히는 걸 기다려 화면을 바꾸면 결과가 영영 안 보일 수 있어요.
   */
  const show = useCallback(() => {
    if (!ADS_ENABLED || adGroupId == null) return;
    if (!readyRef.current) return;

    readyRef.current = false;
    setReady(false);

    let cleanup: (() => void) | null = null;

    cleanup = showFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        switch (event.type) {
          case "impression":
            // 실제로 노출된 시점부터 쿨다운을 세요. 요청만 하고 안 뜬 건 세지 않아요.
            void saveJson(STORAGE_KEYS.lastInterstitialAt, Date.now());
            break;
          case "dismissed":
          case "failedToShow":
            cleanup?.();
            break;
        }
      },
      onError: (error) => {
        console.error("전면 광고 노출 실패:", error);
        cleanup?.();
      },
    });
  }, [adGroupId]);

  return { ready, show };
}
