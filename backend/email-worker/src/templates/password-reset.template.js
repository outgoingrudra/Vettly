
import Handlebars from "handlebars";

const passwordResetTemplate = Handlebars.compile(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password | Vettly</title>
</head>
<body style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:32px;border-radius:12px;">
    <h1 style="color:#172033;">Reset your password</h1>

    <p style="color:#475467;line-height:1.6;">
      Hi {{name}},
    </p>

    <p style="color:#475467;line-height:1.6;">
      We received a request to reset the password for your Vettly account.
      Use the button below to choose a new password.
    </p>

    <p style="margin:28px 0;">
      <a href="{{resetUrl}}"
         style="display:inline-block;padding:14px 22px;background:#243b64;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
        Reset password
      </a>
    </p>

    <p style="color:#475467;line-height:1.6;">
      This link expires in {{expiresIn}} and should only be used once.
      If you didn't request a password reset, ignore this email; your
      password will remain unchanged.
    </p>

    <p style="color:#667085;font-size:13px;line-height:1.6;">
      If the button doesn't work, copy and paste this link into your browser:
      <br />
      <a href="{{resetUrl}}" style="color:#243b64;word-break:break-all;">
        {{resetUrl}}
      </a>
    </p>

    <p style="color:#667085;font-size:13px;">
      This is an automated message from Vettly.
    </p>
  </div>
</body>
</html>
`);

export function renderPasswordResetEmail({ name, resetUrl, expiresIn }) {
  return passwordResetTemplate({ name, resetUrl, expiresIn });
}
