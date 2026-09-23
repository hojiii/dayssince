/**
 * 네비게이션 바 래퍼.
 *
 * `NavigationBar.setOptions`는 `Storage`와 달리 토스 웹뷰가 아니면 그냥 던져요
 * ("apps-in-toss 웹뷰 환경이 아니에요"). 개발용 브라우저에서는 조용히 넘어가야 하니
 * 호출부마다 try/catch를 두지 않도록 여기서 한 번만 감싸요.
 */

import { NavigationBar } from "@apps-in-toss/web-framework";

export async function setNavigationBarBackButton(withBackButton: boolean): Promise<void> {
  try {
    await NavigationBar.setOptions({ withBackButton });
  } catch {
    // 브라우저 등 토스 웹뷰가 아닌 환경이에요. 네이티브 바가 없으니 무시해요.
  }
}
