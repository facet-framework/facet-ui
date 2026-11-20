import type { CSSProperties } from "react";

export type RoleChoice = {
  key: string;

  number: string;
  title: string;

  hint: string;
  onPick: () => void;
  rowStyle: CSSProperties;
  numberStyle: CSSProperties;
  titleStyle: CSSProperties;
  hintStyle: CSSProperties;
};

export type RoleGateProps = {
  containerStyle: CSSProperties;
  innerStyle: CSSProperties;
  headlineStyle: CSSProperties;
  subStyle: CSSProperties;
  listStyle: CSSProperties;
  skipStyle: CSSProperties;
  roles: RoleChoice[];
  headline: string;

  sub: string;
  skipLabel: string;
  onSkip: () => void;
  "data-testid"?: string;
};

export function RoleGate({
  containerStyle,
  innerStyle,
  headlineStyle,
  subStyle,
  listStyle,
  skipStyle,
  roles,
  headline,
  sub,
  skipLabel,
  onSkip,
  ...rest
}: RoleGateProps) {
  return (
    <div style={containerStyle} {...rest}>
      <div style={innerStyle}>
        <h1 style={headlineStyle}>{headline}</h1>
        <p style={subStyle}>{sub}</p>

        <ol style={listStyle}>
          {roles.map((role) => (
            <li key={role.key}>
              <button
                type="button"
                style={role.rowStyle}
                onClick={role.onPick}
                data-role={role.key}
              >
                <span style={role.numberStyle}>{role.number}</span>
                <span style={role.titleStyle}>{role.title}</span>
                <span style={role.hintStyle}>{role.hint}</span>
              </button>
            </li>
          ))}
        </ol>

        <button type="button" style={skipStyle} onClick={onSkip} data-skip>
          {skipLabel}
        </button>
      </div>
    </div>
  );
}

export default RoleGate;
