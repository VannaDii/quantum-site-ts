import * as fs from 'fs';
import * as qs from 'querystring';
import { SES } from 'aws-sdk';
import { Handler, Context, Callback } from 'aws-lambda';
import 'source-map-support/register';

import * as dotenv from 'dotenv';
dotenv.config();

export const assets: Handler = (event: any, context: Context, callback: Callback) => {
  // Ex: event.path: "/assets/styles/index.min.css"
  const reqPath = <string>event.path;
  const pathExt = (<string>reqPath.split('.').pop()).toLowerCase();
  const mimeDict = { css: 'text/css', js: 'application/javascript', png: 'image/png' };
  context.succeed({
    statusCode: 200,
    headers: {
      'Content-Type': mimeDict[pathExt],
    },
    body: fs.readFileSync(`${__dirname}${event.path}`, pathExt === 'png' ? 'base64' : 'utf-8'),
    isBase64Encoded: pathExt === 'png',
  });
};

export const index: Handler = (event: any, context: Context, callback: Callback) => {
  const env_cdn_key = `CDN_${event.requestContext.stage || ''}`.toUpperCase();
  const cdn_domain_name = process.env[env_cdn_key] || '';
  context.succeed({
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: fs
      .readFileSync(`${__dirname}/index.htm`)
      .toString()
      .replace(/\{\{cdn-domain-name\}\}/g, cdn_domain_name),
  });
};

export const contact: Handler = async (event: any, context: Context, callback: Callback) => {
  const data = qs.parse(event.body);
  const firstName: string = <string>data.first_name;
  const lastName: string = <string>data.last_name;
  const subject: string = <string>data.subject;
  const email: string = <string>data.email;
  const comment: string = <string>data.comments;

  const senderEmail = process.env.SENDER_EMAIL;
  const senderName = process.env.SENDER_NAME;
  const senderDomain = process.env.SENDER_URL;

  const cbcTo = `${senderName} <${senderEmail}>`;
  const cbcFrom = `${senderName} <${senderEmail}>`;
  const replyTo = `${firstName} ${lastName} <${email}>`;
  const body_text = `${comment}\r\n\r\n${firstName} ${lastName}\r\n${email}\r\n\r\n\r\nYou can reply directly to this message. This message was sent via ${senderDomain}`;
  const body_html = `
  <html>
    <head>
      <title>${subject}</title>
    </head>
    <body>
      <p>${comment.replace('\n', '<br />')}</p>
      <p>
        ${firstName} ${lastName}<br />
        ${email}
      </p>
      <p>&nbsp;</p>
      <p style="color:#777;font-size:0.75em;">You can reply directly to this message. This message was sent via <a href="${senderDomain}">${senderDomain}</a></p>
    </body>
  </html>
  `;

  const charset = 'UTF-8';
  const sesMailer = new SES({
    accessKeyId: process.env.AWS_SES_ACCESSKEYID,
    secretAccessKey: process.env.AWS_SES_SECRETACCESSKEY,
    region: process.env.AWS_SES_REGION,
  });
  try {
    const data = await sesMailer
      .sendEmail({
        Source: cbcFrom,
        Destination: {
          ToAddresses: [cbcTo],
        },
        ReplyToAddresses: [replyTo],
        Message: {
          Subject: {
            Data: subject,
            Charset: charset,
          },
          Body: {
            Text: {
              Data: body_text,
              Charset: charset,
            },
            Html: {
              Data: body_html,
              Charset: charset,
            },
          },
        },
      })
      .promise();
    console.log('Email sent: ' + JSON.stringify(data));
    context.succeed({
      statusCode: 303,
      headers: {
        Location: './thanks',
      },
      body: '',
    });
  } catch (err) {
    console.log(err);
    context.fail(err);
  }
};

export const thanks: Handler = (event: any, context: Context, callback: Callback) => {
  const env_cdn_key = `CDN_${event.requestContext.stage || ''}`.toUpperCase();
  const cdn_domain_name = process.env[env_cdn_key] || '';
  context.succeed({
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: fs
      .readFileSync(`${__dirname}/thanks.htm`)
      .toString()
      .replace(/\{\{cdn-domain-name\}\}/g, cdn_domain_name),
  });
};

export const ping: Handler = (event: any, context: Context, callback: Callback) => {
  const html: string = `<html><head><title>Ping -> Pong</title></head><body><h1>Ping -> Pong</h1><p>The current date, and time, is ${new Date().toLocaleString()}</p></body></html>`;
  context.succeed({
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: html,
  });
};
