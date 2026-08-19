import { useState } from "react";
import { TabBar, type TabId } from "./components/TabBar";
import { AdFreeProvider } from "./providers/AdFreeProvider";
import { AnniversaryProvider } from "./providers/AnniversaryProvider";
import { HomePage } from "./pages/HomePage";
import { SettingsPage } from "./pages/SettingsPage";

/**
 * 탭 전환에 라우터나 히스토리를 쓰지 않아요.
 *
 * 심사 기준에 "최초 화면에서 뒤로가기를 누르면 미니앱이 종료돼요"와
 * "브라우저 히스토리를 조작하지 않아요"가 있어요. 상태로만 탭을 바꾸면
 * 토스 내비게이션 바의 뒤로가기가 항상 미니앱 종료로 동작해서 둘 다 만족해요.
 */
function App() {
  const [tab, setTab] = useState<TabId>("home");

  return (
    <AdFreeProvider>
      <AnniversaryProvider>
        {tab === "home" && <HomePage />}
        {tab === "settings" && <SettingsPage />}

        <TabBar active={tab} onChange={setTab} />
      </AnniversaryProvider>
    </AdFreeProvider>
  );
}

export default App;
