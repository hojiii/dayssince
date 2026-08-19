/**
 * 설정 화면.
 *
 * 광고를 붙이지 않아요. 결제 흐름과 광고가 같은 화면에 있으면 안 되고,
 * 애초에 스크롤할 콘텐츠도 없어요.
 */

import { useState } from "react";
import { ADFREE_PRICE_LABEL, IAP_READY, useAdFree } from "../hooks/useAdFree";
import { useAnniversaries } from "../hooks/useAnniversaries";
import "./SettingsPage.css";

export function SettingsPage() {
  const { adFree, purchasing, purchase, restore } = useAdFree();
  const { items, remove, clearAll } = useAnniversaries();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="page">
      <h1 className="page-title">설정</h1>

      {IAP_READY && (
        <div className="card">
          <div className="card-label">광고 제거</div>
          {adFree ? (
            <p className="muted">광고 제거를 이용 중이에요. 고마워요!</p>
          ) : (
            <>
              <p className="muted">한 번 결제하면 앱 안의 배너 광고가 사라져요.</p>
              <button
                type="button"
                className="btn btn-primary settings-cta"
                disabled={purchasing}
                onClick={purchase}
              >
                {/* 누르기 전에 얼마인지 알 수 있어야 해요. 표시 금액은 부가세를 포함한 결제가예요. */}
                {purchasing ? "결제 중..." : `광고 제거하기 · ${ADFREE_PRICE_LABEL}`}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => void restore()}>
                구매 복원
              </button>
            </>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-label">등록한 날</div>
        {items.length === 0 ? (
          <p className="muted">아직 등록한 날이 없어요.</p>
        ) : (
          <ul className="settings-list">
            {items.map((item) => (
              <li key={item.id} className="settings-row">
                <span className="muted">
                  {item.emoji} {item.label} · {item.date}
                </span>
                <button type="button" className="text-button is-danger" onClick={() => remove(item.id)}>
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 &&
          (confirming ? (
            <>
              <p className="muted">전부 지울까요? 되돌릴 수 없어요.</p>
              <div className="settings-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)}>
                  그대로 두기
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    clearAll();
                    setConfirming(false);
                  }}
                >
                  전부 지우기
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={() => setConfirming(true)}>
              전부 지우기
            </button>
          ))}
      </div>

      <div className="card">
        <div className="card-label">개인정보 처리</div>
        <p className="muted">
          등록한 이름과 날짜는 기기 안에만 저장해요. 서버로 보내거나 다른 곳에 공유하지 않아요.
          지우기를 누르면 즉시 삭제돼요.
        </p>
      </div>
    </div>
  );
}
