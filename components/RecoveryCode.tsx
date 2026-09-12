import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Text, TextInput, View } from "react-native";
import { AppButton } from "./ui";

export function RecoveryCode({ accountId }: { accountId?: string }) {
  const createCode = useAction(api.recovery.createCode);
  const reset = useAction(api.recovery.resetWithCode);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [generated, setGenerated] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return <AppButton label={accountId ? "Create a recovery code" : "Recover with a saved code"} onPress={() => setOpen(true)} />;
  return <View style={{ gap: 10, paddingVertical: 12 }}>
    <Text>{accountId ? "Keep this one-time code in a password manager or safe place. It can reset your password without email. Creating a new code replaces the old one." : "Enter your saved recovery code. Resetting your password uses the code once and signs out existing sessions."}</Text>
    {!accountId && <TextInput accessibilityLabel="Saved recovery code" placeholder="Recovery code" value={code} onChangeText={setCode} autoCapitalize="none" />}
    <TextInput accessibilityLabel={accountId ? "Current password to create recovery code" : "New recovered account password"} secureTextEntry value={password} onChangeText={setPassword} placeholder={accountId ? "Current password" : "New password"} />
    <AppButton label={busy ? "Please wait…" : accountId ? "Generate code" : "Reset with code"} onPress={async () => {
      if (busy) return;
      setBusy(true); setStatus("");
      try {
        if (accountId) { setGenerated(await createCode({ accountId, password })); setStatus("Save this code now. It will not be shown again."); }
        else { await reset({ code: code.trim(), password }); setCode(""); setStatus("Password reset. Sign in and create a new recovery code."); }
        setPassword("");
      } catch { setStatus("Recovery failed. Check your code or password and try again."); }
      finally { setBusy(false); }
    }} />
    {!!generated && <Text selectable accessibilityLabel="New one-time recovery code">{generated}</Text>}
    {!!status && <Text accessibilityLiveRegion="polite">{status}</Text>}
    <AppButton label="Close recovery" onPress={() => { setOpen(false); setPassword(""); setCode(""); setGenerated(""); }} />
  </View>;
}
