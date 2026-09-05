export const FIELD_WEB_VITAL_TARGETS = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1
} as const;

export type FieldWebVitalName = keyof typeof FIELD_WEB_VITAL_TARGETS;
export type FieldWebVitalMeasurement = {
  name: FieldWebVitalName;
  value: number;
  target: number;
  rating: "good" | "needs-improvement";
};

declare global {
  interface Window {
    __BST_WEB_VITALS__?: Partial<Record<FieldWebVitalName, FieldWebVitalMeasurement>>;
  }
}

/** Measures locally only. Phase 3 deliberately sends no browsing or study data. */
export function startWebVitalsMeasurement() {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return () => undefined;

  window.__BST_WEB_VITALS__ = window.__BST_WEB_VITALS__ || {};
  const observers: PerformanceObserver[] = [];
  const publish = (name: FieldWebVitalName, value: number) => {
    const target = FIELD_WEB_VITAL_TARGETS[name];
    const measurement: FieldWebVitalMeasurement = {
      name,
      value: Math.round(value * (name === "CLS" ? 1000 : 1)) / (name === "CLS" ? 1000 : 1),
      target,
      rating: value <= target ? "good" : "needs-improvement"
    };
    window.__BST_WEB_VITALS__ = { ...(window.__BST_WEB_VITALS__ || {}), [name]: measurement };
    window.dispatchEvent(new CustomEvent("bible-study-tutor:web-vital", { detail: measurement }));
  };
  const observe = (type: string, callback: PerformanceObserverCallback, options: PerformanceObserverInit) => {
    if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return;
    const observer = new PerformanceObserver(callback);
    observer.observe(options);
    observers.push(observer);
  };

  observe("largest-contentful-paint", (list) => {
    const last = list.getEntries().at(-1);
    if (last) publish("LCP", last.startTime);
  }, { type: "largest-contentful-paint", buffered: true });

  let maximumLayoutShiftSession = 0;
  let layoutShiftSession = 0;
  let layoutShiftSessionStart = 0;
  let previousLayoutShift = 0;
  observe("layout-shift", (list) => {
    for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
      if (entry.hadRecentInput) continue;
      if (!layoutShiftSessionStart || entry.startTime - previousLayoutShift > 1000 || entry.startTime - layoutShiftSessionStart > 5000) {
        layoutShiftSession = 0;
        layoutShiftSessionStart = entry.startTime;
      }
      layoutShiftSession += entry.value || 0;
      previousLayoutShift = entry.startTime;
      maximumLayoutShiftSession = Math.max(maximumLayoutShiftSession, layoutShiftSession);
      publish("CLS", maximumLayoutShiftSession);
    }
  }, { type: "layout-shift", buffered: true });

  const interactionDurations: number[] = [];
  observe("event", (list) => {
    for (const entry of list.getEntries() as Array<PerformanceEntry & { duration: number; interactionId?: number }>) {
      if (!entry.interactionId) continue;
      interactionDurations.push(entry.duration);
    }
    interactionDurations.sort((a, b) => a - b);
    const percentileIndex = Math.max(0, Math.ceil(interactionDurations.length * 0.98) - 1);
    publish("INP", interactionDurations[percentileIndex] || 0);
  }, { type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit);

  return () => observers.forEach((observer) => observer.disconnect());
}
