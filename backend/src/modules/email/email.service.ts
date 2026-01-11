import { Injectable, Logger } from '@nestjs/common';
// Use require to avoid missing type declarations in some environments
const nodemailer: any = require('nodemailer');
const QRCode: any = require('qrcode');
const puppeteer: any = require('puppeteer');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: any = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port) {
      this.logger.warn('SMTP not configured (SMPT_HOST/SMTP_PORT missing). Emails will be disabled.');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendRegistrationEmail(event: any, registration: any, recipientEmail?: string) {
    if (!this.transporter) {
      this.logger.warn('Transporter not configured, skipping sendRegistrationEmail');
      return;
    }

    try {
      // Build QR payload
      const qrPayload = JSON.stringify({ ticketCode: registration.ticketCode || registration.ticketCode || registration.ticketCode, eventId: event.id, attendeeName: registration.attendeeName });
      const qrDataUrl = await QRCode.toDataURL(qrPayload);

      // Try to render a full ticket image (styled) server-side using puppeteer
      let ticketBuffer: Buffer | null = null;
      try {
        ticketBuffer = await this.renderTicketBuffer(event, registration, qrDataUrl);
      } catch (err) {
        this.logger.warn('Failed to render ticket image with puppeteer, falling back to inline QR', err as any);
        // fallback: use the QR buffer directly
        const base64 = qrDataUrl.split(',')[1] || '';
        ticketBuffer = Buffer.from(base64, 'base64');
      }

      const to = recipientEmail || registration.email || '';
      if (!to) {
        this.logger.warn('No recipient email for registration, skipping');
        return;
      }

      const subject = `${event.title} - Ticket Confirmation`;

      const ticketCid = `ticket-${registration.ticketCode || Date.now()}@ticket`;

      const formattedDate = event?.date ? new Date(event.date).toLocaleString() : '';
      const formattedTime = event?.time || '';
      const organizer = event?.createdByName || event?.createdBy || 'The organizer';

      const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #111">
          <p>Dear ${registration.attendeeName || 'Attendee'},</p>
          <p>Thank you for registering for <strong>${event.title}</strong>. Attached below is your official ticket for the event. Please present this ticket (printed or on your mobile device) at the event entrance for check-in.</p>
          <p style="margin-top:8px;color:#666;font-size:13px">Event details: <strong>${event.title}</strong> — ${formattedDate}${formattedTime ? ' · ' + formattedTime : ''} · ${event.location || ''} · Organizer: ${organizer}</p>
          <div style="margin-top:18px;">
            <!-- embed the rendered ticket image inline -->
            <img src="cid:${ticketCid}" alt="Ticket" style="max-width:560px;width:100%;height:auto;border-radius:8px;border:1px solid #ddd" />
          </div>
          <p style="color:#666;font-size:12px;margin-top:12px">Registered on ${new Date(registration.registeredAt || Date.now()).toLocaleString()}</p>
          <p style="color:#666;font-size:12px">If you have any questions, please reply to this email or contact the organizer.</p>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com',
        to,
        subject,
        html,
        attachments: [
          { filename: 'ticket.png', content: ticketBuffer as Buffer, cid: ticketCid }
        ]
      });
      this.logger.log(`Sent registration email to ${to}`);
    } catch (err) {
      this.logger.error('Failed to send registration email', err as any);
    }
  }

  // Render a styled ticket image (PNG) server-side using puppeteer
  private async renderTicketBuffer(event: any, registration: any, qrDataUrl: string) {
    let browser: any = null;
    try {
      const formattedDate = event?.date ? new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) : '';
      const formattedTime = event?.time || '';

      const html = `
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { margin:0; padding:40px; background:#dff6f0; font-family: Arial, Helvetica, sans-serif; }
            .card { background: #fff; border-radius: 20px; padding: 36px; max-width:560px; margin:0 auto; box-shadow: 0 6px 18px rgba(0,0,0,0.06); }
            .title { text-align:center; color:#0f766e; font-size:28px; font-weight:700; margin:6px 0 18px 0 }
            .label { text-align:center; color:#9ca3af; font-size:12px; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px }
            .ticket-id { text-align:center; color:#374151; font-size:13px; margin-bottom:8px }
            .details { text-align:center; color:#6b7280; font-size:12px; margin-bottom:12px }
            .qr-wrap { display:flex; justify-content:center; margin-bottom:22px }
            .qr { width:300px; height:300px; border-radius:12px; padding:10px; background:#fff; border:6px solid rgba(0,0,0,0.06); box-shadow: 0 6px 10px rgba(0,0,0,0.04) }
            .name { text-align:center; font-size:16px; font-weight:700; color:#0f172a; margin-top:8px }
            .email { text-align:center; color:#6b7280; font-size:13px }
          </style>
        </head>
        <body>
          <div id="ticket" class="card">
            <div class="label">Event Name</div>
            <div class="title">${(event.title || '').replace(/</g,'&lt;')}</div>
            <div class="label">Ticket ID</div>
            <div class="ticket-id">${registration.ticketCode || ''}</div>
            <div class="details">${formattedDate}${formattedTime ? ' · ' + formattedTime : ''}${event.location ? ' · ' + event.location : ''}</div>
            <div class="qr-wrap"><img class="qr" src="${qrDataUrl}" alt="QR"></div>
            <div class="name">${(registration.attendeeName || registration.attendee?.firstName || '').replace(/</g,'&lt;')}</div>
            <div class="email">${(registration.email || '')}</div>
          </div>
        </body>
        </html>
      `;

      browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setViewport({ width: 700, height: 900, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const el = await page.$('#ticket');
      if (el) {
        const buffer = await el.screenshot({ type: 'png' });
        await browser.close();
        return buffer as Buffer;
      }
      const full = await page.screenshot({ type: 'png', fullPage: true });
      await browser.close();
      return full as Buffer;
    } catch (err) {
      if (browser) try { await browser.close(); } catch {}
      throw err;
    }
  }

  async sendRegistrationWithAttachment(event: any, registration: any, buffer: Buffer, filename: string, recipientEmail?: string) {
    if (!this.transporter) {
      this.logger.warn('Transporter not configured, skipping sendRegistrationWithAttachment');
      return;
    }
    try {
      const to = recipientEmail || registration.email || '';
      if (!to) {
        this.logger.warn('No recipient email for registration attachment, skipping');
        return;
      }

      const subject = `${event.title} - Ticket`;
      // embed the attached ticket image inline so it shows up in the email body for most clients
      const cid = `ticket-${registration.ticketCode || Date.now()}@ticket`;
      const formattedDate2 = event?.date ? new Date(event.date).toLocaleString() : '';
      const formattedTime2 = event?.time || '';
      const organizer2 = event?.createdByName || event?.createdBy || 'The organizer';

      const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #111">
          <p>Dear ${registration.attendeeName || 'Attendee'},</p>
          <p>Please find your ticket for <strong>${event.title}</strong> attached below. Present this ticket at the event entrance for check-in.</p>
          <p style="margin-top:8px;color:#666;font-size:13px">Event details: ${formattedDate2}${formattedTime2 ? ' · ' + formattedTime2 : ''} · ${event.location || ''} · Organizer: ${organizer2}</p>
          <div style="margin-top:16px;">
            <img src="cid:${cid}" alt="Ticket" style="max-width:560px;width:100%;height:auto;border-radius:8px;border:1px solid #ddd" />
          </div>
          <p style="color:#666;font-size:12px;margin-top:12px">Registered on ${new Date(registration.registeredAt || Date.now()).toLocaleString()}</p>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com',
        to,
        subject,
        html,
        attachments: [
          { filename: filename || 'ticket.png', content: buffer, cid }
        ]
      });
      this.logger.log(`Sent registration ticket attachment to ${to}`);
    } catch (err) {
      this.logger.error('Failed to send registration attachment', err as any);
    }
  }
}
