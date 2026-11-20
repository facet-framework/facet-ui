import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { TrailProps, TrailStepView } from "./Trail";

export type TrailStep = {
  key: string;
  label: string;
  onSelect?: () => void;
};

export type WithTrailProps = Omit<
  TrailProps,
  "containerStyle" | "separatorStyle" | "steps" | "label"
> & {
  steps: TrailStep[];
  label?: string;
  style?: CSSProperties;
};

/** Sets the trail: the last level is the current place, all earlier ones are ways back. */
export function withTrailLogic(Component: ComponentType<TrailProps>) {
  const Wrapped = ({ steps, label: labelProp, style, ...rest }: WithTrailProps) => {
    const { t } = useText();
    const label = labelProp ?? t("elements.trail.label");
    const views = useMemo<TrailStepView[]>(
      () =>
        steps.map((step, index) => {
          const current = index === steps.length - 1;
          return {
            key: step.key,
            label: step.label,
            current,
            onClick: step.onSelect,
            style: {
              appearance: "none",
              background: "none",
              border: "none",
              padding: 0,
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: current ? color.ink : color.dim,
              cursor: current || !step.onSelect ? "default" : "pointer",
              whiteSpace: "nowrap",
            },
          };
        }),
      [steps],
    );

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "flex", alignItems: "center", gap: 8, minWidth: 0, ...style }),
      [style],
    );

    const separatorStyle = useMemo<CSSProperties>(
      () => ({ fontFamily: font.mono, fontSize: fontSize.caption, color: color.line2 }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        separatorStyle={separatorStyle}
        steps={views}
        label={label}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withTrailLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
