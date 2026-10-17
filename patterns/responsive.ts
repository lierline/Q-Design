/** Shared intrinsic sizing. Column counts are upper bounds, not viewport promises. */
export function responsiveColumns(
  columns?: number,
  minimum: number | string = "var(--qd-grid-min-width)",
  gap: number | string = "var(--qd-grid-gap)",
): string {
  const length = (value: number | string) => {
    if (typeof value === "number") {
      if (!Number.isFinite(value) || value < 0)
        throw new RangeError("Invalid grid length");
      return `${value}px`;
    }
    return value;
  };
  const min = length(minimum);
  if (columns === undefined)
    return `repeat(auto-fit, minmax(min(100%, ${min}), 1fr))`;
  if (!Number.isInteger(columns) || columns < 1)
    throw new RangeError("Invalid column count");
  const preferred = `calc((100% - ${columns - 1} * ${length(gap)}) / ${columns} - 0.5px)`;
  return `repeat(auto-fit, minmax(min(100%, max(${min}, ${preferred})), 1fr))`;
}
