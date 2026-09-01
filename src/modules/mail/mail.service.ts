import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { EnvConfig } from '../../config/env.schema';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter!: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', { infer: true }),
      port: this.configService.get('SMTP_PORT', { infer: true }),
      secure: this.configService.get('SMTP_PORT', { infer: true }) === 465,
      auth: {
        user: this.configService.get('SMTP_EMAIL', { infer: true }),
        pass: this.configService.get('SMTP_PASS', { infer: true }),
      },
    });
  }

  async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
    const fromName = this.configService.get('SMTP_NAME', { infer: true });
    const fromEmail = this.configService.get('SMTP_EMAIL_FROM', {
      infer: true,
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Verification</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f8;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            border: 1px solid #e1e8ed;
          }
          .header {
            background-color: #ef4444;
            color: #ffffff;
            text-align: center;
            padding: 30px 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
          }
          .content p {
            margin: 0 0 20px;
            font-size: 16px;
          }
          .otp-container {
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            display: inline-block;
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 6px;
            color: #ef4444;
            background-color: #fef2f2;
            padding: 12px 24px;
            border-radius: 6px;
            border: 1px dashed #ef4444;
          }
          .footer {
            background-color: #fafbfc;
            text-align: center;
            padding: 20px;
            font-size: 13px;
            color: #888888;
            border-top: 1px solid #eef2f6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset the password for your account at <strong>${fromName}</strong>. Please use the following One-Time Password (OTP) to proceed with resetting your password. This code is valid for <strong>5 minutes</strong>.</p>
            <div class="otp-container">
              <span class="otp-code">${otp}</span>
            </div>
            <p>If you did not request a password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `[${fromName}] Password Reset OTP`,
      html: htmlContent,
    });
  }
}
