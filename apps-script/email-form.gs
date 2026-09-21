const RECIPIENT_EMAIL = "noreplysoftdev@gmail.com";
const SENDER_NAME = "Nashit";

// Apps Script ContentService does not support custom CORS headers.
// Keep the website request as a simple FormData POST with no custom headers.
function doPost(event) {
  try {
    const data = event && event.parameter ? event.parameter : {};
    const submissionId = cleanLine_(data.submissionId || "");
    const name = cleanLine_(data.name || "Website visitor");
    const email = cleanLine_(data.email || "");
    const message = cleanMessage_(data.message || "");

    if (!email || !message) {
      return json_({
        ok: false,
        error: "Missing email or message.",
      });
    }

    if (!isValidEmail_(email)) {
      return json_({
        ok: false,
        error: "Invalid email address.",
      });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(5000);

    try {
      if (submissionId && isDuplicateSubmission_(submissionId)) {
        return json_({
          ok: true,
          duplicate: true,
        });
      }

      sendContactEmail_(name, email, message);

      if (submissionId) {
        CacheService.getScriptCache().put(`softdev-contact-${submissionId}`, "sent", 300);
      }
    } finally {
      lock.releaseLock();
    }

    return json_({
      ok: true,
    });
  } catch (error) {
    return json_({
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  }
}

function sendContactEmail_(name, email, message) {
    const subject = `New SoftDev site inquiry from ${name}`;
    const body = [
      "New message from the SoftDev site",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      "Message:",
      message,
    ].join("\n");
    const htmlBody = buildEmailHtml_(name, email, message);

    MailApp.sendEmail({
      to: RECIPIENT_EMAIL,
      subject,
      body,
      htmlBody,
      name: SENDER_NAME,
      replyTo: email,
    });
}

function isDuplicateSubmission_(submissionId) {
  return CacheService
    .getScriptCache()
    .get(`softdev-contact-${submissionId}`) === "sent";
}

function doGet() {
  return HtmlService.createHtmlOutput("SoftDev email endpoint is active.");
}

function sendTestEmail() {
  const testName = "Apps Script test";
  const testEmail = RECIPIENT_EMAIL;
  const testMessage = "This is a test message from the SoftDev contact form script.";

  MailApp.sendEmail({
    to: RECIPIENT_EMAIL,
    subject: "SoftDev Apps Script test email",
    body: [
      "SoftDev Apps Script test email",
      "",
      `Name: ${testName}`,
      `Email: ${testEmail}`,
      "",
      "Message:",
      testMessage,
    ].join("\n"),
    htmlBody: buildEmailHtml_(testName, testEmail, testMessage),
    name: SENDER_NAME,
    replyTo: testEmail,
  });
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function cleanLine_(value) {
  return String(value)
    .replace(/[\r\n]+/g, " ")
    .replace(/[<>]/g, "")
    .trim();
}

function cleanMessage_(value) {
  return String(value)
    .replace(/[<>]/g, "")
    .trim();
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildEmailHtml_(name, email, message) {
  const safeName = html_(name);
  const safeEmail = html_(email);
  const safeMessage = html_(message).replace(/\r\n|\n|\r/g, "<br>");

  return `
    <div style="margin:0;padding:0;background:#f7f3ee;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f3ee;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#171514;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #eaded6;border-radius:18px;overflow:hidden;box-shadow:0 18px 44px rgba(42,31,26,0.12);">
              <tr>
                <td style="background:#bd3732;padding:24px 28px;color:#ffffff;">
                  <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;">SoftDev Site</div>
                  <div style="font-size:26px;line-height:1.25;font-weight:800;margin-top:8px;">New project inquiry</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 20px;color:#625b57;font-size:16px;line-height:1.6;">Someone filled out the Email Me form on the SoftDev site. Reply directly to this email to continue the conversation.</p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;border-collapse:collapse;">
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid #eee3db;color:#8a807a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Name</td>
                      <td style="padding:12px 0;border-bottom:1px solid #eee3db;color:#171514;font-size:16px;font-weight:700;text-align:right;">${safeName}</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid #eee3db;color:#8a807a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Email</td>
                      <td style="padding:12px 0;border-bottom:1px solid #eee3db;color:#171514;font-size:16px;font-weight:700;text-align:right;">${safeEmail}</td>
                    </tr>
                  </table>
                  <div style="margin:0 0 22px;padding:18px 20px;background:#fff8f2;border:1px solid #eedfd5;border-radius:14px;">
                    <div style="margin:0 0 10px;color:#bd3732;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Message</div>
                    <div style="color:#2a2523;font-size:16px;line-height:1.7;">${safeMessage}</div>
                  </div>
                  <a href="mailto:${safeEmail}" style="display:inline-block;background:#bd3732;color:#ffffff;text-decoration:none;border-radius:12px;padding:13px 18px;font-size:15px;font-weight:800;">Reply to visitor</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>`;
}

function html_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
