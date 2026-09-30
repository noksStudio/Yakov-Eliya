"use client";

// The personal area's offline copy on the device (kept by public/sw.js as "life-v1").

export const OFFLINE_WARM_KEY = "life-offline-warm";

/** Called on every logout: nothing personal stays on the device. */
export async function clearOfflineData() {
  navigator.serviceWorker?.controller?.postMessage({ type: "LIFE_CLEAR" });
  try {
    localStorage.removeItem(OFFLINE_WARM_KEY);
    await caches.delete("life-v1");
  } catch {
    // Not available (private mode): nothing was saved either.
  }
}
