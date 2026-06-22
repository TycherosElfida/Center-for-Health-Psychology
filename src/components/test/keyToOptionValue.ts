/**
 * keyToOptionValue — Maps a pressed digit key to the answer-option value
 * it selects (FH-5).
 *
 * A digit selects the option with the matching value when one exists, so
 * "0" picks PSS-10's 0-valued option. On 10-point scales without a
 * 0-valued option, "0" stands for the 10 option (keyboard convention:
 * keys 1–9 then 0). Anything else selects nothing.
 *
 * Pure module — extracted from AssessmentForm so the mapping is
 * unit-testable without mounting the component.
 */
export function keyToOptionValue(key: string, optionValues: number[]): number | null {
  if (!/^[0-9]$/.test(key)) return null;

  const digit = Number(key);
  if (optionValues.includes(digit)) return digit;
  if (digit === 0 && optionValues.includes(10)) return 10;

  return null;
}
