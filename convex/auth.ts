import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = String(params.email || "").trim().toLowerCase();
        const name = String(params.name || "").trim().slice(0, 80);

        return {
          email: email.slice(0, 254),
          name: name || email
        };
      }
    })
  ],
});
