export const passwordResetMaxAge = 15 * 60;

/** Inline styles and presentation tables also work in email clients without CSS support. */
export function passwordResetEmail(token: string) {
  const code = token.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]!);
  const minutes = passwordResetMaxAge / 60;
  return {
    subject: "Reset your Bible Study Tutor password",
    text: `Bible Study Tutor\n\nReset your password\n\nEnter this code in the password recovery screen, then choose a new password:\n\n${token}\n\nThis code expires in ${minutes} minutes. Keep it private.\n\nIf you did not request a password reset, you can ignore this email. Your password will stay the same.\n\nBible Study Tutor\nhttps://biblestudytutor.org`,
    html: `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Reset your password · Bible Study Tutor</title></head>
<body style="margin:0;padding:0;background-color:#f8f1e6;color:#241d19;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Your password reset code is ready. It expires in ${minutes} minutes.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8f1e6"><tr><td align="center" style="padding:32px 16px;">
    <!--[if mso]><table role="presentation" width="560"><tr><td><![endif]-->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
      <tr><td style="padding:0 0 24px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
          <td width="44" height="44" align="center" bgcolor="#b5533d" style="border-radius:12px;color:#ffffff;font-size:18px;font-weight:bold;">BT</td>
          <td style="padding-left:12px;color:#39452e;font-size:20px;font-weight:bold;">Bible Study Tutor</td>
        </tr></table>
      </td></tr>
      <tr><td bgcolor="#fffaf2" style="padding:32px 24px;border:1px solid #e4d6c5;border-top:4px solid #c3923e;border-radius:16px;">
        <p style="margin:0 0 12px;color:#66724e;font-size:12px;font-weight:bold;letter-spacing:1.5px;">ACCOUNT RECOVERY</p>
        <h1 style="margin:0 0 16px;color:#241d19;font-size:28px;line-height:1.2;">Reset your password</h1>
        <p style="margin:0 0 24px;color:#766d63;font-size:16px;line-height:1.6;">Let’s get you back to your study. Enter this code in the password recovery screen, then choose a new password.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;"><tr><td align="center" bgcolor="#f0eadf" style="padding:24px 16px;border:1px solid #e4d6c5;border-radius:12px;">
          <p style="margin:0 0 12px;color:#39452e;font-size:13px;font-weight:bold;">Your reset code</p>
          <p style="margin:0;color:#241d19;font-family:Consolas,'Courier New',monospace;font-size:18px;font-weight:bold;line-height:1.6;letter-spacing:0;word-break:break-all;overflow-wrap:anywhere;">${code}</p>
          <p style="margin:12px 0 0;color:#766d63;font-size:13px;line-height:1.5;">Expires in ${minutes} minutes · Keep this code private</p>
        </td></tr></table>
        <p style="margin:24px 0 0;color:#766d63;font-size:14px;line-height:1.6;">If you didn’t request a password reset, you can ignore this email. Your password will stay the same.</p>
      </td></tr>
      <tr><td align="center" style="padding:24px 12px 0;color:#766d63;font-size:13px;line-height:1.6;">
        <a href="https://biblestudytutor.org" style="color:#39452e;text-decoration:underline;">Bible Study Tutor</a>
        <p style="margin:6px 0 0;">Make space for Scripture.</p>
      </td></tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr></table>
</body></html>`
  };
}
