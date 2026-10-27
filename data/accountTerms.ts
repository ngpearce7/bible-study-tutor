export const CURRENT_TERMS_VERSION = "2026-10-27";

export function assertCurrentTermsAcceptance(flow: unknown, accepted: unknown, version: unknown) {
  if (flow === "signUp" && (accepted !== "true" || version !== CURRENT_TERMS_VERSION)) {
    throw new Error("Please agree to the current Terms of Service and Privacy Policy before creating an account.");
  }
}
