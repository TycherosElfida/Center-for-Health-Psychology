/**
 * CHP Platform — Report Email Sender
 *
 * Generates a clinical PDF from ReportData and sends it as an email
 * attachment via Resend. Server-side only.
 */
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { ClinicalReportPDF } from "./pdf-template";
import type { ReportData } from "./assemble";

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return new Resend(key);
}

/**
 * Generate a PDF report and send it to the recipient via email.
 *
 * @param recipientEmail — Decrypted email address
 * @param reportData — Assembled report data
 * @returns The Resend email ID for tracking
 */
export async function sendReportEmail(
  recipientEmail: string,
  reportData: ReportData
): Promise<{ emailId: string }> {
  const resend = getResendClient();

  // Generate PDF buffer
  const pdfBuffer = await renderToBuffer(
    React.createElement(ClinicalReportPDF, { data: reportData })
  );

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `Laporan-${reportData.testSlug}-${dateStr}.pdf`;

  const { data, error } = await resend.emails.send({
    from: "CHP Platform <noreply@chp.ukrida.ac.id>",
    to: recipientEmail,
    subject: `Laporan Hasil Assessment ${reportData.testName} — CHP Platform`,
    html: buildEmailHtml(reportData),
    attachments: [
      {
        filename,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }

  return { emailId: data?.id ?? "" };
}

/**
 * Build simple HTML email body with CHP branding.
 */
function buildEmailHtml(data: ReportData): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a2e;">
      <div style="background: #1B4965; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; font-size: 18px; margin: 0;">
          Center for Health Psychology
        </h1>
        <p style="color: #a0c4d8; font-size: 12px; margin: 4px 0 0 0;">
          UKRIDA — Fakultas Psikologi
        </p>
      </div>

      <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 14px; line-height: 1.6;">
          Yth. Peserta,
        </p>
        <p style="font-size: 14px; line-height: 1.6;">
          Terlampir laporan hasil assessment <strong>${data.testName}</strong> Anda.
          Laporan ini berisi ringkasan skor, interpretasi, dan detail respons Anda.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">Ringkasan:</p>
          <p style="margin: 0; font-size: 15px;">
            <strong>Skor:</strong> ${data.totalScore}/${data.maxPossibleScore}
            &nbsp;·&nbsp;
            <strong>Tingkat:</strong> ${data.resultLabel ?? "-"}
          </p>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin: 16px 0;">
          <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.4;">
            <strong>⚠ Catatan:</strong> Hasil ini merupakan alat skrining awal dan bukan diagnosis klinis.
            Untuk evaluasi lebih lanjut, silakan konsultasikan dengan psikolog atau psikiater berlisensi.
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.6;">
          Salam,<br/>
          <strong>Tim CHP Platform</strong>
        </p>
      </div>

      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
        Email ini dikirim oleh CHP Platform — Center for Health Psychology, UKRIDA.<br/>
        Ini adalah email otomatis, mohon tidak membalas email ini.
      </p>
    </div>
  `;
}
