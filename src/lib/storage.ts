/**
 * 저장소 래퍼.
 *
 * 토스 앱 안에서는 네이티브 `Storage`를, 개발용 브라우저에서는 `localStorage`를 써요.
 *
 * 앱에서 `localStorage`를 쓰면 안 돼요. 웹 표준 저장소는 origin 기준으로 나뉘는데
 * QR 테스트(`*.private-apps.tossmini.com`)와 출시(`*.apps.tossmini.com`)의 URL이
 * 달라서 데이터가 서로 넘어가지 않아요. IndexedDB도 iOS에서 7일간 미사용 시
 * 삭제되기 때문에 쓰지 않아요.
 */

import { Storage as TossStorage } from "@apps-in-toss/web-framework";

/**
 * 네이티브 저장소를 쓸 수 있는 환경인지 한 번만 확인해요.
 *
 * `Storage`에는 `isSupported()`가 없고, 함수 자체는 브라우저에도 존재해요.
 * 호출해야만 "웹뷰 환경이 아니에요" 에러가 나기 때문에 실제로 한 번 불러서 판별해요.
 * 결과는 프로미스로 memo하니 실제 호출은 앱 실행당 한 번이에요.
 */
let probe: Promise<boolean> | null = null;

function nativeAvailable(): Promise<boolean> {
  probe ??= (async () => {
    try {
      await TossStorage.getItem("__probe__");
      return true;
    } catch {
      return false;
    }
  })();
  return probe;
}

async function readRaw(key: string): Promise<string | null> {
  if (await nativeAvailable()) {
    try {
      return await TossStorage.getItem(key);
    } catch (error) {
      console.error("저장소 읽기 실패:", key, error);
      return null;
    }
  }
  return localStorage.getItem(key);
}

async function writeRaw(key: string, value: string): Promise<void> {
  if (await nativeAvailable()) {
    try {
      await TossStorage.setItem(key, value);
    } catch (error) {
      console.error("저장소 쓰기 실패:", key, error);
    }
    return;
  }
  localStorage.setItem(key, value);
}

/**
 * JSON 값을 읽어요. 값이 없거나 깨졌으면 `fallback`을 돌려줘요.
 *
 * 저장소가 깨졌다고 앱이 죽으면 안 되니까 파싱 실패도 조용히 넘겨요.
 */
export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await readRaw(key);
  if (raw == null) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("저장소 값이 손상됐어요:", key, error);
    return fallback;
  }
}

export async function saveJson(key: string, value: unknown): Promise<void> {
  await writeRaw(key, JSON.stringify(value));
}

export const STORAGE_KEYS = {
  /** 등록한 기념일 목록이에요. */
  anniversaries: "anniversaries",
  adFree: "adFree",
  lastInterstitialAt: "lastInterstitialAt",
} as const;
