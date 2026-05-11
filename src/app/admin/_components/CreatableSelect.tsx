import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  inputStyle,
  lockedInputStyle,
  onInputFocus,
  onInputBlur,
  BORDER,
  WHITE,
  BRAND_BG,
  MID_TEXT,
  BRAND_DEEP,
} from "./DesignTokens";

export interface CreatableSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
}

export function CreatableSelect({
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: CreatableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  const [inputValue, setInputValue] = useState(value);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setInputValue(value);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [value]);

  const filteredOptions = useMemo(() => {
    const search = inputValue.toLowerCase().trim();
    return options.filter((o) => o.toLowerCase().includes(search));
  }, [inputValue, options]);

  const showAdd = useMemo(() => {
    const trimmed = inputValue.trim();
    return !!trimmed && !options.some((o) => o.toLowerCase() === trimmed.toLowerCase());
  }, [inputValue, options]);

  const handleSelect = (val: string) => {
    onChange(val);
    setInputValue(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    const maxIndex = filteredOptions.length + (showAdd ? 1 : 0) - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((p) => Math.min(p + 1, maxIndex));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredOptions[highlightIndex];
      if (highlightIndex < filteredOptions.length && selected !== undefined) handleSelect(selected);
      else if (showAdd) handleSelect(inputValue.trim());
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setInputValue(value);
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <input
        value={inputValue}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
          setHighlightIndex(0);
        }}
        onFocus={(e) => {
          setIsOpen(true);
          onInputFocus(e);
        }}
        onBlur={onInputBlur}
        onKeyDown={handleKeyDown}
        style={disabled ? lockedInputStyle : inputStyle}
      />
      {isOpen && !disabled && (filteredOptions.length > 0 || showAdd) && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            maxHeight: 200,
            overflowY: "auto",
            background: WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            zIndex: 10,
            listStyle: "none",
            padding: "4px 0",
            margin: 0,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          {filteredOptions.map((opt, i) => (
            <li
              key={opt}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(opt)}
              onMouseEnter={() => setHighlightIndex(i)}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                color: MID_TEXT,
                cursor: "pointer",
                background: highlightIndex === i ? BRAND_BG : "transparent",
              }}
            >
              {opt}
            </li>
          ))}
          {showAdd && (
            <li
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(inputValue.trim())}
              onMouseEnter={() => setHighlightIndex(filteredOptions.length)}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: BRAND_DEEP,
                cursor: "pointer",
                background: highlightIndex === filteredOptions.length ? BRAND_BG : "transparent",
                borderTop: filteredOptions.length > 0 ? `1px solid ${BORDER}` : "none",
              }}
            >
              Add &quot;{inputValue.trim()}&quot; as new category
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
