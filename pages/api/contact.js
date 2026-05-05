import nodemailer from 'nodemailer'

const smtpPort = Number(process.env.SMTP_PORT || 587)

export const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.isNaN(smtpPort) ? 587 : smtpPort,
  secure: process.env.SMTP_SECURE === 'true',
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
})

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function requiredEnvMissing() {
  return !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  if (requiredEnvMissing()) {
    return res.status(500).json({ ok: false, error: 'Email service not configured' })
  }

  const { name = '', email = '', phone = '', message = '' } = req.body ?? {}

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Name, email, and message are required' })
  }

  try {
    const to = process.env.CONTACT_TO_EMAIL || 'admin@zenvana.com'
    const from = process.env.CONTACT_FROM_EMAIL || 'admin@zenvana.com'

    await smtpTransporter.sendMail({
      to,
      from,
      replyTo: email,
      subject: 'New Contact Request',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;">
          <h2 style="margin:0 0 16px;">New Contact Request</h2>
          <table style="border-collapse:collapse;width:100%;max-width:680px;">
            <tr><td style="padding:8px 0;font-weight:600;width:140px;">Name</td><td style="padding:8px 0;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;">Email</td><td style="padding:8px 0;">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;">Phone</td><td style="padding:8px 0;">${escapeHtml(phone || '-')}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;vertical-align:top;">Message</td><td style="padding:8px 0;white-space:pre-wrap;">${escapeHtml(message)}</td></tr>
          </table>
        </div>
      `,
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Contact email send failed:', error)
    return res.status(500).json({ ok: false, error: 'Failed to send email' })
  }
}
