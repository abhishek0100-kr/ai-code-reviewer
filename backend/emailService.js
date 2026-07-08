const { Resend } = require('resend');
const logger = require('./logger');

// Initialize the Resend SDK engine using your environment token configuration
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Dispatches a transactional account password recovery link payload.
 * @param {string} email - Target user email address.
 * @param {string} rawToken - The un-hashed cryptographic random hex token string.
 */
async function sendPasswordResetEmail(email, rawToken) {
  const resetLink = `http://localhost:3000/reset-password?token=${rawToken}`;

  try {
    // Resend free tier profiles allow instant transactional routing out of the box using their onboarding sandbox address.
    const sender = 'onboarding@resend.dev';

    logger.info(`Initiating transactional mail transfer sequence to Resend endpoint for: ${email}`);

    const response = await resend.emails.send({
      from: `IntelliCode Auditor <${sender}>`,
      to: email,
      subject: '🔒 Reset Your Workspace Security Key',
      html: `
        <div style="font-family: sans-serif; background-color: #020617; color: #f1f5f9; padding: 32px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #6366f1; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">IntelliCode Static Auditor</h2>
          </div>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">Greetings developer,</p>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">An account password reset transaction key was requested for your node profile. Click the secure action element below to choose a new credential password:</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password Key</a>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 16px; margin-top: 24px;">
            This link carries a strict <strong>15-minute operational lifetime window</strong>. If you did not request this recovery packet, you can disregard this message safely.
          </p>
        </div>
      `
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    logger.info(`Transactional recovery email successfully queued by Resend for payload node: ${email}`);
    return true;
  } catch (error) {
    logger.error(`Resend transaction communication dispatch failure for ${email}:`, error);
    return false;
  }
}

module.exports = { sendPasswordResetEmail };