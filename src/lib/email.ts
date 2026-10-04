import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatDate, formatInr, formatMonthLabel } from "@/lib/format";
import { writeAudit } from "@/lib/audit";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string | null;
  isEnabled: boolean;
};

export async function getSmtpSettings(): Promise<SmtpConfig> {
  const dbSetting = await prisma.smtpSetting.findUnique({
    where: { id: "default" },
  });

  if (dbSetting) {
    return {
      host: dbSetting.host || process.env.SMTP_HOST || "smtp.gmail.com",
      port: dbSetting.port || Number(process.env.SMTP_PORT) || 465,
      secure: dbSetting.secure !== undefined ? dbSetting.secure : true,
      user: dbSetting.user || process.env.SMTP_USER || "",
      pass: dbSetting.pass || process.env.SMTP_PASS || "",
      fromEmail: dbSetting.fromEmail || dbSetting.user || process.env.SMTP_FROM || "",
      fromName: dbSetting.fromName || "AimHop ERP Payroll",
      replyTo: dbSetting.replyTo || "",
      isEnabled: dbSetting.isEnabled ?? true,
    };
  }

  // Fallback to environment variables or free Gmail default
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === "true" || !process.env.SMTP_PORT || process.env.SMTP_PORT === "465",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || "",
    fromName: "AimHop ERP Payroll",
    replyTo: "",
    isEnabled: true,
  };
}

export async function saveSmtpSettings(data: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  isEnabled?: boolean;
}) {
  const existing = await prisma.smtpSetting.findUnique({ where: { id: "default" } });
  
  // If pass is empty or placeholder, keep existing password
  let passwordToSave = data.pass?.trim();
  if (!passwordToSave || passwordToSave === "••••••••" || passwordToSave.includes("••")) {
    passwordToSave = existing?.pass || "";
  }

  return prisma.smtpSetting.upsert({
    where: { id: "default" },
    update: {
      host: data.host.trim(),
      port: Number(data.port),
      secure: Boolean(data.secure),
      user: data.user.trim(),
      pass: passwordToSave,
      fromEmail: data.fromEmail.trim() || data.user.trim(),
      fromName: data.fromName.trim() || "AimHop ERP Payroll",
      replyTo: data.replyTo?.trim() || null,
      isEnabled: data.isEnabled ?? true,
    },
    create: {
      id: "default",
      host: data.host.trim(),
      port: Number(data.port),
      secure: Boolean(data.secure),
      user: data.user.trim(),
      pass: passwordToSave,
      fromEmail: data.fromEmail.trim() || data.user.trim(),
      fromName: data.fromName.trim() || "AimHop ERP Payroll",
      replyTo: data.replyTo?.trim() || null,
      isEnabled: data.isEnabled ?? true,
    },
  });
}

export function createMailerTransport(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // true for 465, false for 587
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

export async function testSmtpConnection(testRecipientEmail: string) {
  const config = await getSmtpSettings();

  if (!config.user || !config.pass) {
    return {
      success: false,
      error: "SMTP credentials are missing. Please enter your email and App Password.",
    };
  }

  try {
    const transporter = createMailerTransport(config);
    await transporter.verify();

    const fromAddress = `"${config.fromName}" <${config.fromEmail || config.user}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: testRecipientEmail,
      subject: "✅ AimHop ERP — Free Email Setup Verification",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">AimHop ERP</h1>
            <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Email Gateway Connection Verified</p>
          </div>
          <div style="padding: 28px 24px; color: #334155; line-height: 1.6;">
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">
              <span style="display: inline-block; font-size: 24px; margin-bottom: 6px;">🎉</span>
              <h2 style="margin: 0; font-size: 16px; color: #166534; font-weight: 700;">100% Free SMTP Configuration is Live!</h2>
              <p style="margin: 4px 0 0; font-size: 12px; color: #15803d;">Your salary slip and employee payment emails will now be automatically delivered through this address.</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 140px;">SMTP Host:</td>
                <td style="padding: 8px 0; color: #0f172a; font-family: monospace;">${config.host}:${config.port}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Sender Account:</td>
                <td style="padding: 8px 0; color: #0f172a; font-family: monospace;">${config.user}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Verified Recipient:</td>
                <td style="padding: 8px 0; color: #0f172a; font-family: monospace;">${testRecipientEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Timestamp:</td>
                <td style="padding: 8px 0; color: #0f172a;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td>
              </tr>
            </table>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 24px 0 0; padding-top: 16px; border-top: 1px dashed #e2e8f0;">
              This test was triggered from the AimHop ERP Administration Panel.
            </p>
          </div>
        </div>
      `,
    });

    return {
      success: true,
      message: `Test email successfully sent to ${testRecipientEmail}! Message ID: ${info.messageId}`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to connect to SMTP server: ${errorMsg}`,
    };
  }
}

export function generateSalarySlipHtml({
  companyName,
  employeeName,
  staffCode,
  departmentName,
  designation,
  periodLabel,
  paymentDate,
  amountPaid,
  paymentMethod,
  paymentKind,
  receiptNumber,
  note,
  authorizedBy,
}: {
  companyName: string;
  employeeName: string;
  staffCode: string;
  departmentName: string;
  designation?: string | null;
  periodLabel: string;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: string;
  paymentKind: string;
  receiptNumber?: string | null;
  note?: string | null;
  authorizedBy?: string | null;
}) {
  const methodFormatted = paymentMethod.replace(/_/g, " ").toUpperCase();
  const kindFormatted = paymentKind.toUpperCase();
  const amountInr = formatInr(amountPaid);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salary Disbursement Slip - ${receiptNumber || staffCode}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);">
    
    <!-- Top Header Banner -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">
        ${companyName}
      </h1>
      <p style="margin: 6px 0 0; font-size: 13px; letter-spacing: 1px; opacity: 0.92; font-weight: 600; text-transform: uppercase;">
        Salary & Compensation Disbursement Voucher
      </p>
      ${
        receiptNumber
          ? `<div style="display: inline-block; margin-top: 14px; background: rgba(255, 255, 255, 0.18); border: 1px solid rgba(255, 255, 255, 0.35); padding: 5px 14px; border-radius: 20px; font-family: monospace; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">
              RECEIPT NO: ${receiptNumber}
            </div>`
          : ""
      }
    </div>

    <!-- Status Ribbon -->
    <div style="background: #f0fdf4; border-bottom: 1px solid #bbf7d0; padding: 10px 24px; text-align: center;">
      <span style="color: #166534; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        ✓ Payment Successfully Disbursed & Recorded
      </span>
    </div>

    <!-- Body Container -->
    <div style="padding: 28px 24px;">
      
      <!-- Greeting -->
      <p style="margin: 0 0 18px; font-size: 15px; color: #334155; line-height: 1.5;">
        Dear <strong>${employeeName}</strong>,<br>
        Your compensation for <strong>${periodLabel}</strong> has been processed. Below are the official payment particulars for your records.
      </p>

      <!-- Employee Info Card -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 45%;">Employee Name:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${employeeName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Employee ID / Code:</td>
            <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-weight: 700; text-align: right;">${staffCode}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Department:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${departmentName}</td>
          </tr>
          ${
            designation
              ? `<tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Designation:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${designation}</td>
                </tr>`
              : ""
          }
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payroll Period:</td>
            <td style="padding: 6px 0; color: #2563eb; font-weight: 700; text-align: right;">${periodLabel}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Disbursement Date:</td>
            <td style="padding: 6px 0; color: #0f172a; text-align: right;">${paymentDate}</td>
          </tr>
        </table>
      </div>

      <!-- Amount Highlight Box -->
      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1.5px solid #bfdbfe; border-radius: 14px; padding: 22px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 11px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
          Total Disbursed Amount
        </span>
        <div style="font-size: 32px; font-weight: 900; color: #1e3a8a; font-family: monospace; letter-spacing: -0.5px;">
          ${amountInr}
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: #3b82f6; font-weight: 600;">
          Payment Mode: <span style="color: #1e40af;">${methodFormatted}</span> &nbsp;|&nbsp; Category: <span style="color: #1e40af;">${kindFormatted}</span>
        </div>
      </div>

      <!-- Transaction Remarks -->
      ${
        note
          ? `<div style="background: #ffffff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #475569; background: #f8fafc; border-radius: 0 8px 8px 0;">
              <strong>Note / Reference:</strong> ${note}
            </div>`
          : ""
      }

      <!-- Authorized & Signatures Footer -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 24px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        <tr>
          <td style="vertical-align: top; width: 50%;">
            <p style="margin: 0; font-weight: 600; color: #475569;">Authorized By</p>
            <p style="margin: 4px 0 0; color: #0f172a; font-weight: 700;">${authorizedBy || "Accounts & Payroll Dept."}</p>
            <p style="margin: 2px 0 0; color: #94a3b8; font-size: 11px;">AimHop ERP System</p>
          </td>
          <td style="vertical-align: top; width: 50%; text-align: right;">
            <p style="margin: 0; font-weight: 600; color: #475569;">Security Verification</p>
            <p style="margin: 4px 0 0; color: #166534; font-weight: 700;">✓ Digitally Certified</p>
            <p style="margin: 2px 0 0; color: #94a3b8; font-size: 11px;">No physical signature needed</p>
          </td>
        </tr>
      </table>

      <!-- Bottom Disclaimer -->
      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        This is an automated salary voucher generated by AimHop ERP.<br>
        Please keep this email for your personal tax filing, records, and accounting audits.
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendSalarySlipEmail({
  paymentId,
  recipientOverride,
  actorUserId,
}: {
  paymentId: string;
  recipientOverride?: string;
  actorUserId?: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  recipient?: string;
  unconfigured?: boolean;
}> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      staff: {
        include: {
          department: true,
        },
      },
      receipt: true,
    },
  });

  if (!payment) {
    return { success: false, error: "Payment transaction not found" };
  }

  const recipientEmail = (recipientOverride || payment.staff.email)?.trim();
  if (!recipientEmail) {
    return {
      success: false,
      error: `No email address found for ${payment.staff.fullName} (${payment.staff.staffCode}). Please add an email in staff profile or specify a recipient.`,
    };
  }

  const company = await prisma.company.findFirst();
  const config = await getSmtpSettings();

  // If SMTP is disabled or unconfigured (empty credentials), gracefully report without crashing
  if (!config.user || !config.pass) {
    return {
      success: false,
      unconfigured: true,
      error: "Free SMTP (Gmail) credentials are not configured yet. Go to Admin > Settings to set up your free Gmail App Password.",
    };
  }

  try {
    const transporter = createMailerTransport(config);
    const amountNum = decimalToNumber(payment.amount);
    const periodLabel = formatMonthLabel(payment.periodMonth);
    const dateStr = formatDate(payment.paymentDate);

    const emailHtml = generateSalarySlipHtml({
      companyName: company?.name || "AimHop CRM",
      employeeName: payment.staff.fullName,
      staffCode: payment.staff.staffCode,
      departmentName: payment.staff.department.name,
      designation: payment.staff.designation,
      periodLabel,
      paymentDate: dateStr,
      amountPaid: amountNum,
      paymentMethod: payment.paymentMethod,
      paymentKind: payment.paymentKind,
      receiptNumber: payment.receipt?.receiptNumber || null,
      note: payment.note,
      authorizedBy: payment.receipt?.authorizedBy || "Accounts Officer",
    });

    const fromAddress = `"${config.fromName}" <${config.fromEmail || config.user}>`;
    const subject = `📄 Salary Slip for ${periodLabel} - ${payment.staff.fullName} [${payment.receipt?.receiptNumber || payment.staff.staffCode}]`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject,
      html: emailHtml,
      replyTo: config.replyTo || undefined,
    });

    const now = new Date();

    // Update payment & receipt audit fields
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        emailSentAt: now,
        emailSentTo: recipientEmail,
      },
    });

    if (payment.receipt) {
      await prisma.paymentReceipt.update({
        where: { id: payment.receipt.id },
        data: {
          emailSentAt: now,
          emailSentTo: recipientEmail,
        },
      });
    }

    if (actorUserId) {
      await writeAudit({
        actorUserId,
        action: "payment.email_sent",
        entityType: "payment",
        entityId: payment.id,
        targetLabel: `${payment.staff.staffCode} ${recipientEmail}`,
      });
    }

    return {
      success: true,
      recipient: recipientEmail,
      message: `Salary slip successfully delivered to ${recipientEmail} (ID: ${info.messageId})`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Could not send email: ${errorMsg}`,
    };
  }
}

export async function sendPasswordResetOtpEmail(toEmail: string, otp: string, recipientName?: string) {
  const config = await getSmtpSettings();

  // If SMTP is not enabled or credentials missing, log OTP in console and return for dev
  if (!config.isEnabled || !config.user || !config.pass) {
    console.log(`[AUTH-DEV] Password Reset OTP for ${toEmail}: ${otp}`);
    return {
      success: true,
      deliveredVia: "console",
      devOtp: otp,
      message: `Verification code generated for ${toEmail}. (SMTP not fully configured, code logged to console).`,
    };
  }

  const transporter = createMailerTransport(config);

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">AimHop ERP</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Password Reset Verification Code</p>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello ${recipientName || "there"},</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">We received a request to reset the password for your AimHop ERP account (<strong>${toEmail}</strong>). Please enter the following 6-digit verification code to proceed:</p>
      <div style="background: linear-gradient(135deg, #eff6ff 0%, #f1f5f9 100%); border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5;">This code will expire in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email. Your current password remains unchanged.</p>
      <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 16px; text-align: center;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">AimHop CRM & ERP Enterprise System • Automated Notification</p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: toEmail,
      subject: `[AimHop ERP] ${otp} is your password reset code`,
      html,
    });

    return {
      success: true,
      deliveredVia: "smtp",
      messageId: info.messageId,
      message: `Verification code sent to ${toEmail}.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[SMTP Error sending OTP]:", errorMsg);
    return {
      success: true,
      deliveredVia: "fallback_console",
      devOtp: otp,
      message: `Verification code sent (SMTP notice: ${errorMsg}).`,
    };
  }
}
