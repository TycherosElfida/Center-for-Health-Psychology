"use client";

import { useRef, useEffect, useState } from "react";

interface RejectModalProps {
  /** The request ID to reject, or null to close */
  requestId: string | null;
  requesterDisplay: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  isPending: boolean;
}

const MAX_REASON_LENGTH = 500;

export function RejectModal({
  requestId,
  requesterDisplay,
  onConfirm,
  onCancel,
  isPending,
}: RejectModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");

  // Imperatively open/close the <dialog> element (ADR-4)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (requestId) {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.close();
    }
  }, [requestId]);

  const handleCancel = () => {
    setReason("");
    onCancel();
  };

  const handleSubmit = () => {
    onConfirm(reason.trim() || undefined);
  };

  return (
    <dialog ref={dialogRef} className="admin-modal-dialog" onCancel={handleCancel}>
      <div style={{ padding: "1.5rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "#1F2937",
              margin: 0,
            }}
          >
            Reject Request
          </h3>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "#6B7280",
              margin: "0.375rem 0 0",
            }}
          >
            Rejecting report request from <strong>{requesterDisplay}</strong>
          </p>
        </div>

        {/* Reason textarea */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label
            htmlFor="reject-reason"
            style={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "#374151",
              marginBottom: "0.375rem",
            }}
          >
            Reason <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LENGTH))}
            placeholder="Provide a reason for rejection…"
            rows={3}
            disabled={isPending}
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #E2DCF0",
              fontSize: "0.8125rem",
              resize: "vertical",
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color 0.15s ease",
              color: "#1F2937",
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              textAlign: "right",
              fontSize: "0.6875rem",
              color: reason.length >= MAX_REASON_LENGTH ? "#C62828" : "#9CA3AF",
              marginTop: "0.25rem",
            }}
          >
            {reason.length}/{MAX_REASON_LENGTH}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #E2DCF0",
              background: "transparent",
              color: "#6B7280",
              fontSize: "0.8125rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="admin-btn-reject"
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            {isPending && (
              <span
                className="admin-spin"
                style={{ display: "inline-block", width: "14px", height: "14px" }}
              >
                ⟳
              </span>
            )}
            Reject
          </button>
        </div>
      </div>
    </dialog>
  );
}
