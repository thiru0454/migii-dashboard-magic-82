declare module 'nodemailer' {
  export interface Transporter {
    sendMail(mailOptions: Mail.Options): Promise<any>;
  }

  export function createTransport(options: any): Transporter;
  export function getTestMessageUrl(info: any): string;

  export namespace Mail {
    export interface Options {
      from?: string;
      to?: string | string[];
      cc?: string | string[];
      bcc?: string | string[];
      subject?: string;
      text?: string;
      html?: string;
      attachments?: Attachment[];
      headers?: Headers;
    }

    export interface Attachment {
      filename?: string;
      content?: string | Buffer;
      path?: string;
      contentType?: string;
      cid?: string;
    }

    export interface Headers {
      [key: string]: string;
    }
  }
}