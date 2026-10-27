import { expect, test } from "vitest";
import { assertCurrentTermsAcceptance, CURRENT_TERMS_VERSION } from "./accountTerms";

test("new accounts must accept the current terms", () => {
  expect(() => assertCurrentTermsAcceptance("signUp", undefined, undefined)).toThrow("Please agree");
  expect(() => assertCurrentTermsAcceptance("signUp", "true", "old-version")).toThrow("Please agree");
  expect(() => assertCurrentTermsAcceptance("signUp", "true", CURRENT_TERMS_VERSION)).not.toThrow();
});

test("existing users can sign in without re-accepting signup terms", () => {
  expect(() => assertCurrentTermsAcceptance("signIn", undefined, undefined)).not.toThrow();
});
