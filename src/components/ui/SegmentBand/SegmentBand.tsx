import type { CSSProperties } from "react";

export type SegmentView = {
  key: string;

  width: string;
  background: string;

  title: string;
};

export type SegmentBandProps = {
  segments: SegmentView[];
  containerStyle: CSSProperties;

  label: string;
  "data-testid"?: string;
};

export function SegmentBand({ segments, containerStyle, label, ...rest }: SegmentBandProps) {
  return (
    <div style={containerStyle} role="img" aria-label={label} {...rest}>
      {segments.map((segment) => (
        <div
          key={segment.key}
          title={segment.title}
          data-segment={segment.key}
          style={{ width: segment.width, background: segment.background, height: "100%" }}
        />
      ))}
    </div>
  );
}

export default SegmentBand;
