/**
 * 배너 광고 자리.
 *
 * 화면당 하나만 쓰세요. 같은 화면에 같은 포맷 광고를 2개 이상 두면 정책 위반이에요.
 * 광고 제거를 구매한 사용자에게는 아무것도 렌더하지 않아요.
 */

import { LIVE_BANNER_AD_GROUP_ID, useBannerAd } from "../hooks/useBannerAd";
import { useAdFree } from "../hooks/useAdFree";
import { ADS_ENABLED } from "../lib/monetization";
import "./BannerSlot.css";

export function BannerSlot({ adGroupId = LIVE_BANNER_AD_GROUP_ID }: { adGroupId?: string | null }) {
  const { adFree } = useAdFree();
  // adGroupId가 없으면(광고 그룹 발급 전) 자리 자체를 만들지 않아요.
  const { containerRef, rendered } = useBannerAd(adGroupId ?? "", {
    disabled: !ADS_ENABLED || adFree || adGroupId == null,
  });

  if (!ADS_ENABLED || adFree || adGroupId == null) return null;

  return (
    <div className="banner-slot">
      <div ref={containerRef} className="banner-slot-target" />
      {/* 광고가 아직 안 붙었을 때 레이아웃이 튀지 않도록 자리만 잡아둬요. */}
      {!rendered && <div className="banner-slot-placeholder" aria-hidden="true" />}
    </div>
  );
}
