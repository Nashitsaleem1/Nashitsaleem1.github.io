# Google Apps Script email form

This folder contains the Google Apps Script endpoint for the website contact form.

1. Sign in to Google with the mailbox that should send the form emails.
2. Open Apps Script and create a new project.
3. Paste `email-form.gs` into the default script file.
4. Deploy as a web app.
5. Set "Execute as" to "Me".
6. Set "Who has access" to "Anyone".
7. Copy the deployed `/exec` URL.
8. Paste that URL into `EMAIL_SCRIPT_URL` in `assets/js/theme-switcher.js`.

For the current test, `RECIPIENT_EMAIL` is set to `noreplysoftdev@gmail.com`, and `SENDER_NAME` is set to `Nashit`.

The email subject is `New SoftDev site inquiry from {name}`. The message uses a styled HTML email body and no longer includes Page or Source fields.

Duplicate protection is enabled with a `submissionId` from the website plus Apps Script `LockService` and `CacheService`. If the browser accidentally submits twice, only one email should be sent.

To test sending directly from Apps Script, select `sendTestEmail` from the function dropdown in the editor and click Run. If that test email arrives, Gmail permissions and `RECIPIENT_EMAIL` are working.

## CORS note

Apps Script `ContentService` does not let this script set custom CORS headers like `Access-Control-Allow-Origin`.

The website avoids CORS problems by sending a simple `FormData` POST with no custom headers and `mode: "no-cors"`.
