import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Text, TextInput, View } from "react-native";
import { AppButton } from "./ui";

export function PasswordRecovery({ enabled }: { enabled: boolean }) {
  const { signIn } = useAuthActions();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  if (!open) return <AppButton label="Forgot password?" onPress={() => setOpen(true)} />;
  return <View style={{ gap: 10, paddingVertical: 12 }}>
    <Text>Email recovery requires the email used to create your account. Username-only accounts cannot receive a reset email.</Text>
    {!enabled ? <Text>Email recovery is not configured yet. Contact support@biblestudytutor.org for help.</Text> : <>
      <TextInput accessibilityLabel="Recovery email" placeholder="Email address" autoCapitalize="none" keyboardType="email-address" value={email} editable={!busy && !sent} onChangeText={setEmail} />
      {sent && <>
        <TextInput accessibilityLabel="Password reset code" placeholder="Code from email" autoCapitalize="none" value={code} onChangeText={setCode} />
        <TextInput accessibilityLabel="New password" placeholder="New password (at least 8 characters)" secureTextEntry value={password} onChangeText={setPassword} />
      </>}
      <AppButton label={busy ? "Please wait…" : sent ? "Reset password" : "Send reset code"} onPress={async () => {
        if (busy) return;
        const address = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) { setStatus("Enter your account email address."); return; }
        if (sent && (password.length < 8 || !code.trim())) { setStatus("Enter your code and a password of at least 8 characters."); return; }
        setBusy(true);
        try {
          await signIn("password", { email: address, flow: sent ? "reset-verification" : "reset", ...(sent ? { code: code.trim(), newPassword: password } : {}) });
          setStatus(sent ? "Password reset. You can sign in with your new password." : "If this email has an account, a reset code has been sent.");
          if (sent) { setPassword(""); setCode(""); setSent(false); } else setSent(true);
        } catch {
          setStatus(sent ? "The code could not be verified. Request a new code and try again." : "If this email has an account, a reset code has been sent.");
          if (!sent) setSent(true);
        } finally { setBusy(false); }
      }} />
      {sent && <AppButton label="Use another email or request a new code" onPress={() => { setSent(false); setCode(""); }} />}
    </>}
    {!!status && <Text accessibilityLiveRegion="polite">{status}</Text>}
    <AppButton label="Back to sign in" onPress={() => { setOpen(false); setPassword(""); setCode(""); setStatus(""); }} />
  </View>;
}
