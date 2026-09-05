import { trackReliabilityMetric, type ReliabilityOperation, type ReliabilityProvider } from "@/data/reliabilityMetrics";

const DEFAULT_REQUEST_TIMEOUT_MS = 12_000;

type RequestMetric = { provider: ReliabilityProvider; operation: ReliabilityOperation };

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  metric?: RequestMetric
) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const parentSignal = init.signal;
  const abortFromParent = () => controller.abort();

  if (parentSignal?.aborted) controller.abort();
  else parentSignal?.addEventListener("abort", abortFromParent, { once: true });

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    if (metric) {
      trackReliabilityMetric({
        kind: "provider_request",
        ...metric,
        outcome: response.ok ? "success" : "error",
        errorCode: response.ok ? undefined : response.status >= 500 ? "http_5xx" : "http_4xx",
        durationMs: Date.now() - startedAt
      });
    }
    return response;
  } catch (error) {
    if (timedOut) {
      if (metric) trackReliabilityMetric({ kind: "provider_request", ...metric, outcome: "timeout", errorCode: "timeout", durationMs: Date.now() - startedAt });
      const timeoutError = new Error("Request timed out");
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    if (!parentSignal?.aborted && metric) {
      trackReliabilityMetric({ kind: "provider_request", ...metric, outcome: "error", errorCode: "network", durationMs: Date.now() - startedAt });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
}

export function throwIfRequestAborted(signal?: AbortSignal) {
  if (!signal?.aborted) return;
  const error = new Error("Request aborted");
  error.name = "AbortError";
  throw error;
}
