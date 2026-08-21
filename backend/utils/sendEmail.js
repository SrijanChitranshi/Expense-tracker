import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generic sender used for budget-exceeded alerts and recurring-payment
// reminders. Kept intentionally simple/reusable.
export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER) {
    console.warn('[email] SMTP not configured, skipping send:', subject);
    return;
  }
  await transporter.sendMail({
    from: `"Expense Tracker" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};
