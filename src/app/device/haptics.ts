const HAPTIC_PATTERNS: Record<string, number | number[]> = {
  success: [12, 4, 12],
  error: [30, 20, 30],
  light: 10
};

export function triggerHaptic(type: "success" | "error" | "light", enabled: boolean) {
  if (!enabled) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const pattern = HAPTIC_PATTERNS[type] ?? HAPTIC_PATTERNS.light;
    navigator.vibrate(pattern);
  }
}
