import type { CSSProperties } from "react";

export type PyramidLevel = {
  key: string;
  /** Name of the level, e.g. "Unit". */
  label: string;
  count: number;
  /** Share of all tests, rounded. */
  share: number;
  rowStyle: CSSProperties;
  labelStyle: CSSProperties;
  barStyle: CSSProperties;
  countStyle: CSSProperties;
};

export type TestPyramidProps = {
  containerStyle: CSSProperties;
  captionStyle: CSSProperties;
  levels: PyramidLevel[];
  /** Answer line: what the distribution says. */
  caption: string;
  "data-testid"?: string;
};

/**
 * Distribution of the tests across the levels from `verification.*_tests`.
 * The shape is called a pyramid because there should be more at the bottom
 * than at the top — whether that is so is said by the answer line, not the
 * picture.
 */
export function TestPyramid({
  containerStyle,
  captionStyle,
  levels,
  caption,
  ...rest
}: TestPyramidProps) {
  return (
    <div style={containerStyle} {...rest}>
      <p style={captionStyle}>{caption}</p>
      {levels.map((level) => (
        <div key={level.key} style={level.rowStyle} data-level={level.key}>
          <span style={level.labelStyle}>{level.label}</span>
          <span style={level.barStyle} />
          <span style={level.countStyle}>{level.count}</span>
        </div>
      ))}
    </div>
  );
}

export default TestPyramid;
