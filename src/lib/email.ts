import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Sunday <noreply@sunday.app>'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

/**
 * Send an email via Resend.
 * Silently no-ops when RESEND_API_KEY is not configured (dev/staging).
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', to)
    return false
  }

  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html })
    return true
  } catch (err) {
    console.error('[email] Failed to send email:', err)
    return false
  }
}

/**
 * Generate a notification email HTML body.
 * Minimal, inline-styled template for broad email client compatibility.
 */
export function notificationEmailHtml({
  title,
  message,
  link,
  recipientName,
}: {
  title: string
  message: string
  link?: string | null
  recipientName?: string
}): string {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,'
  const actionButton = link
    ? `<a href="${escapeHtml(link)}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4d556a;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:14px;">View in Sunday</a>`
    : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 0;">
          <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1a1a1a;">${escapeHtml(title)}</p>
        </td></tr>
        <tr><td style="padding:16px 32px 0;">
          <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">${greeting}</p>
          <p style="margin:8px 0 0;color:#555;font-size:14px;line-height:1.6;">${escapeHtml(message)}</p>
          ${actionButton}
        </td></tr>
        <tr><td style="padding:24px 32px 32px;">
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 16px;">
          <p style="margin:0;font-size:11px;color:#999;">Sunday — Task & Planning System</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
}

/**
 * Generate an invite email HTML body.
 */
export function inviteEmailHtml({
  recipientName,
  teamName,
  setPasswordUrl,
}: {
  recipientName: string
  teamName?: string | null
  setPasswordUrl: string
}): string {
  const teamLine = teamName
    ? `You've been added to the <strong>${escapeHtml(teamName)}</strong> team.`
    : `You've been added to the team.`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 0;">
          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#1a1a1a;">Welcome to Sunday</p>
        </td></tr>
        <tr><td style="padding:16px 32px 0;">
          <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">Hi ${escapeHtml(recipientName)},</p>
          <p style="margin:8px 0 0;color:#555;font-size:14px;line-height:1.6;">${teamLine} Set your password to get started.</p>
          <a href="${escapeHtml(setPasswordUrl)}" style="display:inline-block;margin-top:20px;padding:14px 28px;background:#4d556a;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:14px;">Set Your Password</a>
        </td></tr>
        <tr><td style="padding:24px 32px 32px;">
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 16px;">
          <p style="margin:0;font-size:11px;color:#999;">If you didn't expect this invite, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
