import type { CSSProperties, KeyboardEvent } from "react";

export type RestTick = { key: string; background: string; flexGrow: number };

export type RestCloudProps = {
  containerStyle: CSSProperties;
  stripStyle: CSSProperties;
  labelStyle: CSSProperties;

  ticks: RestTick[];

  label: string;
  expanded: boolean;
  onToggle: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  "data-testid"?: string;
};

export function RestCloud({
  containerStyle,
  stripStyle,
  labelStyle,
  ticks,
  label,
  expanded,
  onToggle,
  onKeyDown,
  ...rest
}: RestCloudProps) {
  return (
    <div
      style={containerStyle}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={label}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      {...rest}
    >
      <div style={stripStyle}>
        {ticks.map((tick) => (
          <span
            key={tick.key}
            data-tick={tick.key}
            style={{ background: tick.background, flexGrow: tick.flexGrow, height: "100%" }}
          />
        ))}
      </div>
      <span style={labelStyle}>{label}</span>
    </div>
  );
}

export default RestCloud;
