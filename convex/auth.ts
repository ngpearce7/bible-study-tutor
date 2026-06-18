import { convexAuth } from "@convex-dev/auth/server";
import Apple from "@auth/core/providers/apple";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";

const USERNAME_AUTH_DOMAIN = "username.biblestudytutor.local";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@+/, "");
}

function usernameCredential(username: string) {
  return `${username}@${USERNAME_AUTH_DOMAIN}`;
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    Apple,
    Password({
      profile(params) {
        const requestedUsername = normalizeUsername(String(params.username || ""));
        const isUsernameAccount = params.authMode === "username" || !!requestedUsername;
        if (isUsernameAccount && !/^[a-z0-9][a-z0-9._-]{2,23}$/.test(requestedUsername)) {
          throw new Error("Username must be 3 to 24 characters and use letters, numbers, dots, hyphens, or underscores.");
        }
        const email = isUsernameAccount
          ? usernameCredential(requestedUsername)
          : String(params.email || "").trim().toLowerCase();
        const name = String(params.name || "").trim().slice(0, 80);

        return {
          email: email.slice(0, 254),
          name: name || (isUsernameAccount ? requestedUsername : email)
        };
      }
    })
  ],
});
