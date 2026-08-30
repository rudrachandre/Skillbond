const nodemailer = require('nodemailer');

/**
 * Sends an email via Gmail SMTP.
 *
 * Credentials come from environment variables:
 *   EMAIL_USER - the Gmail address to send from
 *   EMAIL_PASS - a Gmail "App Password", NOT the regular account password.
 *     Gmail blocks regular-password SMTP logins; the user must generate an
 *     App Password from their Google Account -> Security -> 2-Step
 *     Verification -> App Passwords, and use that 16-character value here.
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER / EMAIL_PASS are not configured');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
};

module.exports = sendEmail;
