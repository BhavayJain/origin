const nodemailer = require('nodemailer');

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendBookingNotification(booking) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (!adminEmail || !hasSmtpConfig()) {
    console.log('Booking notification queued:', {
      studentName: booking.studentName,
      parentName: booking.parentName,
      phone: booking.phone,
      branchName: booking.branchName,
      preferredDate: booking.preferredDate,
      preferredTime: booking.preferredTime
    });
    return { sent: false, reason: 'SMTP not configured' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'Vidyarupa Discovery <no-reply@vidyarupa.edu>',
    to: adminEmail,
    subject: `New campus tour request: ${booking.studentName}`,
    html: `
      <h2>New Tour Booking</h2>
      <p><strong>Student:</strong> ${booking.studentName}</p>
      <p><strong>Parent:</strong> ${booking.parentName}</p>
      <p><strong>Phone:</strong> ${booking.phone}</p>
      <p><strong>Email:</strong> ${booking.email}</p>
      <p><strong>Branch:</strong> ${booking.branchName}</p>
      <p><strong>Date/Time:</strong> ${new Date(booking.preferredDate).toDateString()} at ${booking.preferredTime}</p>
      <p><strong>Visitors:</strong> ${booking.visitors}</p>
      <p><strong>Message:</strong> ${booking.message || '-'}</p>
    `
  });

  return { sent: true };
}

module.exports = { sendBookingNotification };
