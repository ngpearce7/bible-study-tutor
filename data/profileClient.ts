import { useCallback } from "react";
import { useMutation as useConvexMutation, useQuery as useConvexQuery } from "convex/react";
import { getFunctionName, type FunctionReference, type FunctionArgs } from "convex/server";
import { getCachedDeviceKey } from "./deviceKey";
import { guestFunctions } from "./guestFunctions";

function credentialArgs<F extends FunctionReference<"query" | "mutation">>(reference: F, args: FunctionArgs<F>) {
  if (!guestFunctions.has(getFunctionName(reference))) return args;
  const clientKey = getCachedDeviceKey();
  if (!clientKey) throw new Error("Device profile is still connecting");
  return { ...args, clientKey };
}

/** Centralize credential transport so no individual guest endpoint omits it. */
export const useQuery: typeof useConvexQuery = (reference, ...args) => {
  const supplied = args[0];
  const forwarded = [supplied === "skip" ? "skip" : credentialArgs(reference, supplied || {})] as typeof args;
  return useConvexQuery(reference, ...forwarded);
};

export function useMutation<F extends FunctionReference<"mutation">>(reference: F) {
  const mutate = useConvexMutation(reference);
  const functionName = getFunctionName(reference);
  return useCallback((args: FunctionArgs<F>) => mutate(credentialArgs(reference, args)), [mutate, functionName]);
}
