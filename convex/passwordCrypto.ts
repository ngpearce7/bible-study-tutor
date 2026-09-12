import { Scrypt } from "lucia";

// Same Scrypt format used by the installed Convex Auth Password provider.
// Configure both normal credentials and recovery explicitly with this adapter.
export const passwordCrypto = {
  hashSecret: (password: string) => new Scrypt().hash(password),
  verifySecret: (password: string, hash: string) => new Scrypt().verify(hash, password)
};
