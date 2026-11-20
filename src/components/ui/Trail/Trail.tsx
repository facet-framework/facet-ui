import type { CSSProperties } from "react";

export type TrailStepView = {
  key: string;
  label: string;
  style: CSSProperties;
  onClick?: () => void;
  current: boolean;
};

export type TrailProps = {
  containerStyle: CSSProperties;
  separatorStyle: CSSProperties;
  steps: TrailStepView[];

  label: string;
  "data-testid"?: string;
};

export function Trail({ containerStyle, separatorStyle, steps, label, ...rest }: TrailProps) {
  return (
    <nav style={containerStyle} aria-label={label} {...rest}>
      {steps.map((step, index) => (
        <span key={step.key} style={{ display: "contents" }}>
          {index > 0 ? (
            <span style={separatorStyle} aria-hidden="true">
              ·
            </span>
          ) : null}
          {step.onClick && !step.current ? (
            <button type="button" style={step.style} onClick={step.onClick}>
              {step.label}
            </button>
          ) : (
            <span style={step.style} aria-current={step.current ? "step" : undefined}>
              {step.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default Trail;
