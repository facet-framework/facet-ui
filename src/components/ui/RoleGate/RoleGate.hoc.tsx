import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { rolesIn, type RoleKey } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { RoleChoice, RoleGateProps } from "./RoleGate";

export type WithRoleGateProps = Omit<
  RoleGateProps,
  | "containerStyle"
  | "innerStyle"
  | "headlineStyle"
  | "subStyle"
  | "listStyle"
  | "skipStyle"
  | "roles"
  | "headline"
  | "sub"
  | "skipLabel"
  | "onSkip"
> & {
  onPick?: (key: RoleKey) => void;
  /** What "continue without choosing" picks; by default the first role. */
  fallback?: RoleKey;
  style?: CSSProperties;
};

/** Numbers the eight roles and passes them through as the choice. */
export function withRoleGateLogic(Component: ComponentType<RoleGateProps>) {
  const Wrapped = ({ onPick, fallback = "c", style, ...rest }: WithRoleGateProps) => {
    const text = useText();
    const { t } = text;
    const roles = useMemo<RoleChoice[]>(
      () =>
        rolesIn(text).map((role, index) => ({
          key: role.key,
          number: String(index + 1).padStart(2, "0"),
          title: role.title,
          hint: role.hint,
          onPick: () => onPick?.(role.key),
          rowStyle: ROW_STYLE,
          numberStyle: NUMBER_STYLE,
          titleStyle: TITLE_STYLE,
          hintStyle: HINT_STYLE,
        })),
      [onPick, text],
    );

    const containerStyle = useMemo<CSSProperties>(
      () => ({
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 30px",
        ...style,
      }),
      [style],
    );

    return (
      <Component
        containerStyle={containerStyle}
        innerStyle={INNER_STYLE}
        headlineStyle={HEADLINE_STYLE}
        subStyle={SUB_STYLE}
        listStyle={LIST_STYLE}
        skipStyle={SKIP_STYLE}
        roles={roles}
        headline={t("elements.roleGate.headline")}
        sub={t("elements.roleGate.sub")}
        skipLabel={t("elements.roleGate.skip")}
        onSkip={() => onPick?.(fallback)}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withRoleGateLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}

const INNER_STYLE: CSSProperties = { width: "100%", maxWidth: 640 };

const HEADLINE_STYLE: CSSProperties = {
  margin: "0 0 6px",
  fontFamily: font.sans,
  fontSize: fontSize.display,
  fontWeight: 300,
  letterSpacing: "-0.02em",
  color: color.ink,
};

const SUB_STYLE: CSSProperties = {
  margin: "0 0 30px",
  fontFamily: font.sans,
  fontSize: fontSize.base,
  color: color.dim,
};

const LIST_STYLE: CSSProperties = {
  display: "grid",
  gap: 0,
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const ROW_STYLE: CSSProperties = {
  appearance: "none",
  background: "none",
  border: "none",
  borderTop: `1px solid ${color.line}`,
  width: "100%",
  display: "grid",
  gridTemplateColumns: "16px minmax(0, 180px) minmax(0, 1fr)",
  gap: 16,
  alignItems: "baseline",
  padding: "13px 0",
  textAlign: "left",
  cursor: "pointer",
};

const NUMBER_STYLE: CSSProperties = {
  fontFamily: font.mono,
  fontSize: fontSize.caption,
  color: color.faint,
  fontVariantNumeric: "tabular-nums",
};

const TITLE_STYLE: CSSProperties = {
  fontFamily: font.sans,
  fontSize: fontSize.lead,
  fontWeight: 400,
  color: color.ink,
  whiteSpace: "nowrap",
};

const HINT_STYLE: CSSProperties = {
  fontFamily: font.mono,
  fontSize: fontSize.caption,
  color: color.dim,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const SKIP_STYLE: CSSProperties = {
  appearance: "none",
  background: "none",
  border: "none",
  borderTop: `1px solid ${color.line}`,
  width: "100%",
  display: "block",
  textAlign: "left",
  fontFamily: font.mono,
  fontSize: fontSize.caption,
  color: color.dim,
  marginTop: 22,
  paddingTop: 16,
  cursor: "pointer",
};
