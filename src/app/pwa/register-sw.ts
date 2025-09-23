export async function registerServiceWorker() {
  if (import.meta.env.DEV) return;
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          console.info("New content available; it will be used after the next reload.");
        }
      });
    });
  } catch (error) {
    console.error("Service worker registration failed", error);
  }
}
