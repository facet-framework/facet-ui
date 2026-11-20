import type { CSSProperties } from "react";

/** A role as it is offered for choice in the gate. */
export type RoleChoice = {
  key: string;
  /** Running number, two digits — `01` to `08`. */
  number: string;
  title: string;
  /** What this role starts with — three words, no explanation. */
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
  /** What the choice does — and what it does not do. */
  sub: string;
  skipLabel: string;
  onSkip: () => void;
  "data-testid"?: string;
};

/**
 * The role gate — the question between reading and the overview.
 *
 * It appears once, before Atlas opens, and answers exactly one question:
 * what the lead sentence starts with. It locks nothing: every section, every record
 * and every number stays reachable for every role afterwards — that is why it says
 * "sets the order, not the access".
 *
 * The rows are buttons and not clickable surfaces. The draft draws
 * them as rows with `onClick`; eight choices that cannot be
 * tabbed to would be a gate the keyboard cannot get past.
 */
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
