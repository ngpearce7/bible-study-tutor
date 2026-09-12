import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Text, TextInput, View } from "react-native";
import { AppButton } from "./ui";
import { recoveryStyles } from "./recoveryStyles";

export function PasswordRecovery({ enabled, darkMode = false }: { enabled: boolean; darkMode?: boolean }) {
  const styles = recoveryStyles(darkMode);
  const { signIn } = useAuthActions();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  if (!open) return <AppButton label={enabled ? "Reset password by email" : "Email recovery options"} variant="secondary" style={styles.secondary} labelStyle={styles.secondaryLabel} onPress={() => setOpen(true)} />;
  return <View style={styles.panel}>
    <Text style={styles.text}>Email recovery requires the email used to create your account. Username-only accounts cannot receive a reset email.</Text>
    {!enabled ? <Text style={styles.text}>Password reset by email is currently unavailable. If you saved a recovery code, choose “Use a saved recovery code” below. For other help, contact support@biblestudytutor.org.</Text> : <>
      <TextInput style={styles.input} placeholderTextColor={darkMode ? "#bcb29f" : "#766d63"} autoCorrect={false} accessibilityLabel="Recovery email" placeholder="Email address" autoCapitalize="none" keyboardType="email-address" value={email} editable={!busy && !sent} onChangeText={setEmail} />
      {sent && <>
        <TextInput style={styles.input} placeholderTextColor={darkMode ? "#bcb29f" : "#766d63"} autoCorrect={false} accessibilityLabel="Password reset code" placeholder="Code from email" autoCapitalize="none" value={code} onChangeText={setCode} />
        <TextInput style={styles.input} placeholderTextColor={darkMode ? "#bcb29f" : "#766d63"} autoCorrect={false} accessibilityLabel="New password" placeholder="New password (at least 8 characters)" secureTextEntry value={password} onChangeText={setPassword} />
      </>}
      <AppButton disabled={busy} label={busy ? (sent ? "Resetting password…" : "Sending code…") : sent ? "Reset password" : "Send reset code"} onPress={async () => {
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
      {sent && <AppButton label="Change email or start again" variant="secondary" style={styles.secondary} labelStyle={styles.secondaryLabel} disabled={busy} onPress={() => { setSent(false); setCode(""); setPassword(""); setStatus(""); }} />}
    </>}
    {!!status && <Text style={styles.text} accessibilityLiveRegion="polite">{status}</Text>}
    <AppButton label="Close email recovery" variant="secondary" style={styles.secondary} labelStyle={styles.secondaryLabel} disabled={busy} onPress={() => { setOpen(false); setSent(false); setPassword(""); setCode(""); setStatus(""); }} />
  </View>;
}
