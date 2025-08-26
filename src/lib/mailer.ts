import nodemailer from 'nodemailer';

let transporterPromise: Promise<any> | null = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: !!process.env.SMTP_SECURE,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    // Development: use Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  })();

  return transporterPromise;
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@example.com',
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  // log preview URL for Ethereal
  // eslint-disable-next-line no-console
  if ((nodemailer as any).getTestMessageUrl) {
    // @ts-ignore
    const url = nodemailer.getTestMessageUrl(info);
    if (url) console.info('[MAIL] preview URL:', url);
  }

  return info;
}
