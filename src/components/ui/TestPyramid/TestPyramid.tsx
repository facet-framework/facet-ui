import type { CSSProperties } from "react";

export type PyramidLevel = {
  key: string;

  label: string;
  count: number;

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

  caption: string;
  "data-testid"?: string;
};

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
