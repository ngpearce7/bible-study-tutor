import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Text, TextInput, View } from "react-native";
import { AppButton } from "./ui";
import { recoveryStyles } from "./recoveryStyles";

export function RecoveryCode({ accountId, darkMode = false }: { accountId?: string; darkMode?: boolean }) {
  const styles = recoveryStyles(darkMode);
  const createCode = useAction(api.recovery.createCode);
  const reset = useAction(api.recovery.resetWithCode);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [generated, setGenerated] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return <AppButton label={accountId ? "Create a recovery code" : "Use a saved recovery code"} variant="secondary" style={styles.secondary} labelStyle={styles.secondaryLabel} onPress={() => { setStatus(""); setOpen(true); }} />;
  return <View style={styles.panel}>
    <Text style={styles.text}>{accountId ? "Keep this one-time code in a password manager or safe place. It can reset your password without email. Creating a new code replaces the old one." : "Enter your saved recovery code. The code can be used once to set a new password. Existing sessions will expire and cannot be renewed."}</Text>
    {!accountId && <TextInput style={styles.input} placeholderTextColor={darkMode ? "#bcb29f" : "#766d63"} autoCorrect={false} accessibilityLabel="Saved recovery code" placeholder="Recovery code" value={code} onChangeText={setCode} autoCapitalize="none" />}
    <TextInput style={styles.input} placeholderTextColor={darkMode ? "#bcb29f" : "#766d63"} autoCorrect={false} accessibilityLabel={accountId ? "Current password to create recovery code" : "New recovered account password"} secureTextEntry value={password} onChangeText={setPassword} placeholder={accountId ? "Current password" : "New password"} />
    <AppButton disabled={busy} label={busy ? (accountId ? "Generating code…" : "Resetting password…") : accountId ? "Generate recovery code" : "Reset password"} onPress={async () => {
      if (busy) return;
      if (accountId && !password) { setStatus("Enter your current password."); return; }
      if (!accountId && !/^[a-f0-9]{64}$/.test(code.trim())) { setStatus("Enter the complete 64-character recovery code you saved."); return; }
      if (!accountId && password.length < 8) { setStatus("Choose a new password with at least 8 characters."); return; }
      setGenerated(""); setBusy(true); setStatus("");
      try {
        if (accountId) { setGenerated(await createCode({ accountId, password })); setStatus("Save this code now. It will not be shown again."); }
        else { await reset({ code: code.trim(), password }); setCode(""); setStatus("Password reset. Sign in and create a new recovery code."); }
        setPassword("");
      } catch { setStatus(accountId ? "Could not generate a code. Check your current password and try again." : "Could not reset your password. Check that the recovery code is correct and has not been used."); }
      finally { setBusy(false); }
    }} />
    {!!generated && <Text style={styles.code} selectable accessibilityLabel="New one-time recovery code">{generated}</Text>}
    {!!status && <Text style={styles.text} accessibilityLiveRegion="polite">{status}</Text>}
    <AppButton label="Close recovery code options" variant="secondary" style={styles.secondary} labelStyle={styles.secondaryLabel} disabled={busy} onPress={() => { setOpen(false); setPassword(""); setCode(""); setGenerated(""); setStatus(""); }} />
  </View>;
}
