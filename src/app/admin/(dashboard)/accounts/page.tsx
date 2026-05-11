"use client";

import { useState } from "react";
import { AdminAccountsTab } from "./_components/AdminAccountsTab";
import { UserAccountsTab } from "./_components/UserAccountsTab";

const DT = {
  TEAL: "#9B8EC4",
  TEAL_DARK: "#6B5CA0",
  DARK_TEXT: "#1A202C",
  MID_TEXT: "#4A5568",
  LIGHT_TEXT: "#718096",
  BORDER: "#E2DCF0",
  WHITE: "#FFFFFF",
  BG_ALT: "#FBFAFD",
} as const;

type Tab = "admins" | "users";

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("admins");

  return (
    <div
      className="admin-fade-in"
      style={{ padding: "0.5rem 0", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: DT.DARK_TEXT,
            margin: 0,
            letterSpacing: "-0.015em",
          }}
        >
          Account Management
        </h1>
        <p style={{ fontSize: 13, color: DT.LIGHT_TEXT, margin: "4px 0 0" }}>
          Manage admin and respondent accounts
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { key: "admins" as Tab, label: "Admin Accounts", icon: "🛡️" },
          { key: "users" as Tab, label: "Respondent Accounts", icon: "👤" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 12,
                border: `1.5px solid ${isActive ? DT.TEAL : DT.BORDER}`,
                background: isActive ? `${DT.TEAL}12` : DT.WHITE,
                color: isActive ? DT.TEAL : DT.MID_TEXT,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "admins" ? <AdminAccountsTab /> : <UserAccountsTab />}
    </div>
  );
}
