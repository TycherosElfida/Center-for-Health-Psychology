/**
 * CHP Admin — PDF Report Download Endpoint
 *
 * GET /api/admin/report-pdf?scoreId=<uuid>
 *
 * Validates admin JWT from cookies, assembles report data,
 * renders the ClinicalReportPDF template, and streams the
 * PDF buffer as application/pdf.
 */
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { assembleReportData } from "@/server/reports/assemble";
import { ClinicalReportPDF } from "@/server/reports/pdf-template";
import { getAdminTokenFromHeaders, verifyAdminToken } from "@/lib/admin-auth";
import React from "react";

export async function GET(request: NextRequest) {
  // 1. Auth check — validate admin JWT
  const token = getAdminTokenFromHeaders(request.headers);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await verifyAdminToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  // 2. Parse scoreId
  const { searchParams } = new URL(request.url);
  const scoreId = searchParams.get("scoreId");
  if (!scoreId) {
    return NextResponse.json({ error: "scoreId is required" }, { status: 400 });
  }

  try {
    // 3. Assemble report data
    const reportData = await assembleReportData(scoreId);

    // 4. Render PDF to buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(ClinicalReportPDF, { data: reportData }) as any;
    const buffer = await renderToBuffer(element);

    // 5. Return as downloadable PDF
    const filename = `CHP-${reportData.testSlug.toUpperCase()}-${scoreId.slice(0, 8)}.pdf`;
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("PDF generation failed:", msg);

    if (msg.includes("not found")) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
