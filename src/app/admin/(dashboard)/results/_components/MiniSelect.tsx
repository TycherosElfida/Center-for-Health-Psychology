"use client";

import { X } from "lucide-react";
import { DT } from "./types";

interface MiniSelectProps {
  label?: string;
  value: string;
  options: Array<{ value: string; label: string } | string>;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MiniSelect({ value, onChange, options, placeholder = "All" }: MiniSelectProps) {
  return (
    <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: DT.WHITE,
          border: `1px solid ${DT.BORDER}`,
          borderRadius: 10,
          padding: "7px 10px",
          paddingRight: value ? 48 : 28, // Extra space for clear button
          fontSize: 12,
          color: value ? DT.DARK_TEXT : DT.LIGHT_TEXT,
          fontWeight: 500,
          outline: "none",
          width: "100%",
          fontFamily: "'Inter', sans-serif",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23718096' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          cursor: "pointer",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          const val = typeof opt === "string" ? opt : opt.value;
          const lbl = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>

      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 26, // Before the chevron
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Clear selection"
        >
          <X size={12} color={DT.LIGHT_TEXT} />
        </button>
      )}
    </div>
  );
}
