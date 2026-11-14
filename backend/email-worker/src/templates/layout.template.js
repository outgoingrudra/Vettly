import Handlebars from "handlebars";

// Table layout and inline styles keep the message readable in common email clients.
const template = Handlebars.compile(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{title}} · Vettly</title>
</head>
<body style="margin:0;padding:0;background:#eeeae1;color:#23382f;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">{{preheader}}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#eeeae1;">
    <tr><td align="center" style="padding:32px 14px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:100%;max-width:600px;border-collapse:collapse;background:#fffdf7;border:1px solid #d9d4c7;">
        <tr><td style="padding:24px 36px;background:#163d32;color:#fffdf7;">
          <span style="font-family:Georgia,serif;font-size:27px;letter-spacing:-1px;font-weight:bold;">Vettly</span>
          <span style="display:block;margin-top:4px;color:#b9d8c7;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Interview platform</span>
        </td></tr>
        <tr><td style="padding:40px 36px 28px;">
          <p style="margin:0 0 16px;color:#a3623e;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">{{category}}</p>
          <h1 style="margin:0 0 20px;color:#193c31;font-family:Georgia,serif;font-size:38px;font-weight:normal;line-height:1.15;letter-spacing:-1px;">{{title}}</h1>
          <p style="margin:0 0 16px;color:#26372e;font-size:16px;line-height:1.6;">{{greeting}}</p>
          <p style="margin:0 0 16px;color:#43534b;font-size:16px;line-height:1.65;">{{intro}}</p>
          {{#if detail}}<p style="margin:0 0 24px;color:#43534b;font-size:16px;line-height:1.65;">{{detail}}</p>{{/if}}
          {{#if url}}<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:28px 0;">
            <tr><td bgcolor="#163d32" style="border-radius:5px;"><a href="{{url}}" style="display:inline-block;padding:14px 22px;color:#fffdf7;font-size:14px;font-weight:bold;text-decoration:none;">{{action}} &nbsp;→</a></td></tr>
          </table>{{/if}}
          {{#if footnote}}<p style="margin:24px 0 0;padding:16px 0 0;border-top:1px solid #e2ded3;color:#65716a;font-size:13px;line-height:1.6;">{{footnote}}</p>{{/if}}
          {{#if url}}<p style="margin:22px 0 0;color:#65716a;font-size:12px;line-height:1.6;">Button not working? Open this link in your browser.<br><a href="{{url}}" style="color:#175c46;word-break:break-all;">{{url}}</a></p>{{/if}}
        </td></tr>
        <tr><td style="padding:18px 36px;background:#f4f1e8;border-top:1px solid #e2ded3;color:#65716a;font-size:12px;line-height:1.5;">
          Sent by Vettly · Account and interview notifications.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`);

export function renderEmailLayout(content) {
  return template(content);
}
