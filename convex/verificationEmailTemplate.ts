type VerificationEmailKind = "account" | "new-account" | "change-address";

export function verificationEmailTemplate(code: string, kind: VerificationEmailKind) {
  const isChange = kind === "change-address";
  const heading = isChange ? "Confirm your new email address" : "Confirm your email address";
  const intro = isChange
    ? "Enter this code in Bible Study Tutor to confirm your new email address. Your sign-in address stays the same until you do."
    : kind === "new-account"
      ? "Enter this code in Bible Study Tutor to finish setting up your account."
      : "Enter this code on the Account screen to confirm your email address.";
  const safeCode = code.replace(/\D/g, "");
  const subject = isChange ? "Confirm your new Bible Study Tutor email" : "Your Bible Study Tutor confirmation code";
  const text = ["BIBLE STUDY TUTOR", "", heading, "", intro, "", safeCode, "",
    "This code expires in 15 minutes. If you did not request it, you can safely ignore this email.",
    "", "Bible Study Tutor | https://biblestudytutor.org"].join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:#edf2f5;color:#172536;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;font-size:1px;color:#edf2f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">Your confirmation code for Bible Study Tutor</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#edf2f5;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #dbe4ea;border-radius:16px;">
<tr><td style="padding:28px 32px;background:#172536;border-radius:15px 15px 0 0;color:#ffffff;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="40" height="40"><img src="https://biblestudytutor.org/apple-touch-icon.png" width="40" height="40" alt="" style="display:block;border:0;border-radius:10px;"></td><td style="padding-left:12px;color:#ffffff;font-size:20px;font-weight:700;line-height:1.2;">Bible Study Tutor</td></tr></table></td></tr>
<tr><td style="padding:32px;"><p style="margin:0 0 12px;color:#8b5527;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Account confirmation</p><h1 style="margin:0 0 16px;color:#172536;font-size:27px;line-height:1.25;">${heading}</h1><p style="margin:0 0 24px;color:#50657a;font-size:16px;line-height:1.55;">${intro}</p><div style="padding:20px 12px;background:#e8f2fb;border:1px solid #c9dfef;border-radius:10px;text-align:center;color:#172536;font-size:32px;font-weight:700;letter-spacing:6px;line-height:1.3;">${safeCode}</div><p style="margin:22px 0 0;color:#50657a;font-size:14px;line-height:1.55;">This code expires in <strong>15 minutes</strong>. If you did not request it, you can safely ignore this email.</p></td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e0e7ec;color:#64768a;font-size:12px;line-height:1.5;">Bible Study Tutor &nbsp;·&nbsp; <a href="https://biblestudytutor.org" style="color:#264a70;">biblestudytutor.org</a></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}
