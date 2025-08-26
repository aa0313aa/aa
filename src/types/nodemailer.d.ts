declare module 'nodemailer' {
  export interface Transporter {
    sendMail(opts: any): Promise<any>;
  }

  export function createTransport(opts: any): Transporter;
  export function createTestAccount(): Promise<{ user: string; pass: string }>;
  export function getTestMessageUrl(info: any): string | false | undefined;

  const nodemailer: {
    createTransport: typeof createTransport;
    createTestAccount: typeof createTestAccount;
    getTestMessageUrl: typeof getTestMessageUrl;
  };

  export default nodemailer;
}
