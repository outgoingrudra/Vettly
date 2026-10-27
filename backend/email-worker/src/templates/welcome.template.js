
import Handlebars from "handlebars";

const welcomeTemplate = Handlebars.compile(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Vettly</title>
</head>
<body style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:32px;border-radius:12px;">
    <h1 style="color:#172033;">Welcome to Vettly, {{name}}!</h1>

    <p style="color:#475467;line-height:1.6;">
      We're glad you're here. Vettly helps teams run interviews
      and assessments in one place.
    </p>

    <p style="color:#475467;line-height:1.6;">
      Your account has been created successfully.
    </p>

    <p style="color:#667085;font-size:13px;">
      This is an automated message from Vettly.
    </p>
  </div>
</body>
</html>
`);

export function renderWelcomeEmail(data) {
  return welcomeTemplate({
    name: data.name,
  });
}
