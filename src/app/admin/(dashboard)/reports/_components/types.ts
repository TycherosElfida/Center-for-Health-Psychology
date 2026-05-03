/** Shared types for the Email Requests page components. */

export type ReportRequestStatus = "pending" | "reviewed" | "sent" | "rejected";

export interface EnrichedReportRequest {
  id: string;
  requesterType: "guest" | "authenticated";
  requesterDisplay: string;
  testName: string;
  testSlug: string;
  totalScore: number | null;
  resultLabel: string | null;
  status: ReportRequestStatus;
  rejectionReason: string | null;
  requestedAt: Date;
  reviewedAt: Date | null;
  processedAt: Date | null;
}

export type SortField = "requestedAt" | "requesterDisplay" | "testName" | "status";
export type SortDirection = "asc" | "desc";
