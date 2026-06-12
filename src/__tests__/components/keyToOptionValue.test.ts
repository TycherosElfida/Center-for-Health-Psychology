/**
 * CHP Platform — Keyboard Answer Shortcut Mapping Tests (FH-5)
 *
 * keyToOptionValue maps a pressed digit key to the option value it
 * selects. Scan finding N-7: the old inline mapping sent "0" to 10
 * unconditionally, so PSS-10's value-0 option ("Tidak Pernah") could
 * never be selected by keyboard although the on-screen hint advertised
 * keys 0–4. A digit must select the matching option value when one
 * exists; the "0" → 10 convention is preserved for 10-point scales
 * that have no 0-valued option.
 */
import { describe, it, expect } from "vitest";
import { keyToOptionValue } from "@/components/test/keyToOptionValue";

const PSS10_VALUES = [0, 1, 2, 3, 4];
const LIKERT6_VALUES = [1, 2, 3, 4, 5, 6];
const TEN_POINT_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const BINARY_VALUES = [0, 1];

describe("keyToOptionValue (FH-5)", () => {
  it("1 — '0' selects the 0-valued option when one exists (PSS-10)", () => {
    expect(keyToOptionValue("0", PSS10_VALUES)).toBe(0);
    expect(keyToOptionValue("0", BINARY_VALUES)).toBe(0);
  });

  it("2 — '0' still selects 10 on 10-point scales without a 0 option", () => {
    expect(keyToOptionValue("0", TEN_POINT_VALUES)).toBe(10);
  });

  it("3 — '0' selects nothing when neither a 0 nor a 10 option exists", () => {
    expect(keyToOptionValue("0", LIKERT6_VALUES)).toBeNull();
  });

  it("4 — digits 1–9 map directly to matching option values", () => {
    expect(keyToOptionValue("3", LIKERT6_VALUES)).toBe(3);
    expect(keyToOptionValue("4", PSS10_VALUES)).toBe(4);
    expect(keyToOptionValue("9", TEN_POINT_VALUES)).toBe(9);
  });

  it("5 — out-of-range digits select nothing", () => {
    expect(keyToOptionValue("7", PSS10_VALUES)).toBeNull();
    expect(keyToOptionValue("8", LIKERT6_VALUES)).toBeNull();
  });

  it("6 — non-digit keys select nothing", () => {
    expect(keyToOptionValue("j", PSS10_VALUES)).toBeNull();
    expect(keyToOptionValue("ArrowDown", PSS10_VALUES)).toBeNull();
    expect(keyToOptionValue("", PSS10_VALUES)).toBeNull();
    expect(keyToOptionValue("10", TEN_POINT_VALUES)).toBeNull();
  });
});
