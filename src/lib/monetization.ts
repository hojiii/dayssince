/**
 * 수익화 기능 스위치.
 *
 * 광고와 결제는 콘솔 준비 상태가 달라서 따로 켜요.
 * 상품이 없는 채로 결제 버튼을 노출하면 "눌러도 실패하는 버튼"이 돼서 심사에서 반려돼요.
 */

/**
 * 인앱 광고(배너)를 켜요.
 *
 * 콘솔에 광고 지면이 만들어져 있고 `.env`에 실제 광고 그룹 ID가 들어가 있어야 해요.
 */
export const ADS_ENABLED = true;

/**
 * 광고 제거 인앱 결제를 켜요.
 *
 * `.env`의 VITE_ADFREE_SKU에 콘솔에서 발급받은 productId가 들어가 있어야 실제로 노출돼요.
 * 두 조건을 함께 본 결과가 `hooks/useAdFree`의 `IAP_READY`이고, 화면은 그 값을 봐요.
 */
export const IAP_ENABLED = true;
