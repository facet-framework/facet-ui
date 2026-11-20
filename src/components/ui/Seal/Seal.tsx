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
  /** Count, e.g. "5/7". */
  count: string;
  /** Plain text naming which facets are filled. */
  label: string;
  "data-testid"?: string;
};

/**
 * Seal — seven stripes, one per facet. Filled or empty, plus the
 * count `n/7`. No interpretation: the stripe only says whether the facet is in
 * the record.
 */
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
