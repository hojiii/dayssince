import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  // 콘솔에서 생성된 canonical appName과 정확히 같아야 빌드가 통과해요.
  appName: "dayssince",
  brand: {
    primaryColor: "#f59e0b",
  },
  // 기록은 모두 기기에서만 다루고 외부 API를 쓰지 않아서 별도 권한이 필요 없어요.
  permissions: [],
  webBundleDir: "dist",
});
