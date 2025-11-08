import { supabase } from './supabase'
import { sendVerificationEmail } from './email'

/**
 * Generate a verification token and send verification email
 */
export async function sendVerification(userId: string, email: string, displayName: string): Promise<boolean> {
  try {
    // Generate verification token
    const verificationToken = crypto.randomUUID()

    // Set expiration to 24 hours from now
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // Update user with verification token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_token: verificationToken,
        verification_token_expires: expiresAt.toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user with verification token:', updateError)
      return false
    }

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken, displayName)

    return emailSent
  } catch (error) {
    console.error('Error in sendVerification:', error)
    return false
  }
}

/**
 * Verify an email using the verification token
 */
export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find user with this token
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email_verified, verification_token_expires')
      .eq('verification_token', token)
      .single()

    if (fetchError || !user) {
      return {
        success: false,
        message: 'Invalid verification token. Please request a new verification email.',
      }
    }

    // Check if already verified
    if (user.email_verified) {
      return {
        success: true,
        message: 'Your email is already verified!',
      }
    }

    // Check if token has expired
    if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
      return {
        success: false,
        message: 'Verification token has expired. Please request a new verification email.',
      }
    }

    // Mark email as verified and clear token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user verification status:', updateError)
      return {
        success: false,
        message: 'Failed to verify email. Please try again.',
      }
    }

    return {
      success: true,
      message: 'Email verified successfully! You can now make picks.',
    }
  } catch (error) {
    console.error('Error in verifyEmail:', error)
    return {
      success: false,
      message: 'An error occurred. Please try again.',
    }
  }
}

/**
 * Resend verification email
 */
export async function resendVerification(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Get user info
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('email, display_name, email_verified')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      return {
        success: false,
        message: 'User not found.',
      }
    }

    if (user.email_verified) {
      return {
        success: false,
        message: 'Your email is already verified.',
      }
    }

    // Send new verification email
    const sent = await sendVerification(userId, user.email, user.display_name)

    if (!sent) {
      return {
        success: false,
        message: 'Failed to send verification email. Please try again.',
      }
    }

    return {
      success: true,
      message: 'Verification email sent! Please check your inbox.',
    }
  } catch (error) {
    console.error('Error in resendVerification:', error)
    return {
      success: false,
      message: 'An error occurred. Please try again.',
    }
  }
}
