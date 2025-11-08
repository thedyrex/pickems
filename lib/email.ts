import { Resend } from 'resend'

// Initialize Resend client (lazy initialization to avoid errors during build)
let resend: Resend | null = null

function getResendClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set. Please add it to your .env.local file.')
    }
    resend = new Resend(apiKey)
  }
  return resend
}

export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  displayName: string
) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`

  try {
    const client = getResendClient()
    await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your email - Pick\'ems',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: white; border: 3px solid #f97316; padding: 40px; text-align: center;">
                <h1 style="margin: 0 0 20px 0; color: #111827;">
                  <span style="color: #111827;">PICK'</span><span style="color: #f97316;">EMS</span>
                </h1>

                <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 24px;">
                  Welcome, ${displayName}!
                </h2>

                <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
                  Thanks for signing up! Please verify your email address to start making picks.
                </p>

                <a href="${verificationUrl}"
                   style="display: inline-block; background-color: #f97316; color: white; text-decoration: none; padding: 14px 32px; font-weight: bold; font-size: 16px; border: none;">
                  VERIFY EMAIL
                </a>

                <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 14px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px; word-break: break-all;">
                  ${verificationUrl}
                </p>

                <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 12px;">
                  This link will expire in 24 hours.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Welcome to Pick'ems, ${displayName}!

Thanks for signing up! Please verify your email address to start making picks.

Click the link below to verify your email:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, you can safely ignore this email.
      `.trim(),
    })
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    return false
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  displayName: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

  try {
    const client = getResendClient()
    await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Reset your password - Pick\'ems',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: white; border: 3px solid #f97316; padding: 40px; text-align: center;">
                <h1 style="margin: 0 0 20px 0; color: #111827;">
                  <span style="color: #111827;">PICK'</span><span style="color: #f97316;">EMS</span>
                </h1>

                <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 24px;">
                  Password Reset Request
                </h2>

                <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
                  Hi ${displayName}, we received a request to reset your password. Click the button below to create a new password.
                </p>

                <a href="${resetUrl}"
                   style="display: inline-block; background-color: #f97316; color: white; text-decoration: none; padding: 14px 32px; font-weight: bold; font-size: 16px; border: none;">
                  RESET PASSWORD
                </a>

                <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 14px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px; word-break: break-all;">
                  ${resetUrl}
                </p>

                <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 12px;">
                  This link will expire in 1 hour.
                </p>

                <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Password Reset Request

Hi ${displayName}, we received a request to reset your password.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.
      `.trim(),
    })
    return true
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return false
  }
}
