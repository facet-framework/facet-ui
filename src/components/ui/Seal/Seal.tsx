import type { CSSProperties } from "react";

export type SealStripe = {
  key: string;
  label: string;
  filled: boolean;
  style: CSSProperties;
};

export type SealProps = {
  containerStyle: CSSProperties;
  countStyle: CSSProperties;
  stripes: SealStripe[];

  count: string;

  label: string;
  "data-testid"?: string;
};

export function Seal({ containerStyle, countStyle, stripes, count, label, ...rest }: SealProps) {
  return (
    <span style={containerStyle} role="img" aria-label={label} {...rest}>
      {stripes.map((stripe) => (
        <span key={stripe.key} data-facet={stripe.key} title={stripe.label} style={stripe.style} />
      ))}
      <span style={countStyle}>{count}</span>
    </span>
  );
}

export default Seal;
