import { smtpTransporter } from './contact'

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

function isValidFutureOrTodayDate(dateText) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return false

  const parsed = new Date(`${dateText}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return false

  const [y, m, d] = dateText.split('-').map(Number)
  if (parsed.getFullYear() !== y || parsed.getMonth() + 1 !== m || parsed.getDate() !== d) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return parsed >= today
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  if (requiredEnvMissing()) {
    return res.status(500).json({ ok: false, error: 'Email service not configured' })
  }

  const {
    name = '',
    email = '',
    phone = '',
    eventType = '',
    date = '',
    guests = '',
    message = '',
  } = req.body ?? {}

  if (!name || !email || !phone || !eventType || !date || !guests || !message) {
    return res.status(400).json({ ok: false, error: 'All fields are required' })
  }

  if (!isValidFutureOrTodayDate(date)) {
    return res.status(400).json({ ok: false, error: 'Please provide a valid event date.' })
  }

  try {
    await smtpTransporter.sendMail({
      to: 'admin@zenvana.com',
      from: 'admin@zenvana.com',
      replyTo: email,
      subject: 'New Event Booking Request',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;">
          <h2 style="margin:0 0 16px;">New Event Booking Request</h2>
          <table style="border-collapse:collapse;width:100%;max-width:700px;">
            <tr><td style="padding:8px 0;font-weight:600;width:160px;">Name</td><td style="padding:8px 0;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;">Email</td><td style="padding:8px 0;">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;">Phone</td><td style="padding:8px 0;">${escapeHtml(phone)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;">Event Type</td><td style="padding:8px 0;">${escapeHtml(eventType)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;">Date</td><td style="padding:8px 0;">${escapeHtml(date)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;">Guests</td><td style="padding:8px 0;">${escapeHtml(String(guests))}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;vertical-align:top;">Message</td><td style="padding:8px 0;white-space:pre-wrap;">${escapeHtml(message)}</td></tr>
          </table>
        </div>
      `,
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Event booking email send failed:', error)
    return res.status(500).json({ ok: false, error: 'Failed to send booking request' })
  }
}
