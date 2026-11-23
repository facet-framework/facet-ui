import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/** A step of the spacing scale (`--t-s-1` … `--t-s-8`): 4, 8, 12, 16, 24, 32, 48, 64 px. */
export type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const space = (step: Space | undefined) =>
  step == null ? undefined : step === 0 ? "0" : `var(--t-s-${step})`;

type BoxProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  children?: ReactNode;
  /** The element to render; a `div` by default. */
  as?: ElementType;
};

export type StackProps = BoxProps & {
  gap?: Space;
  align?: CSSProperties["alignItems"];
};

/** Children in a column with one gap from the spacing scale. */
export function Stack({ gap, align, as: Tag = "div", className, style, ...rest }: StackProps) {
  return (
    <Tag
      className={cx("t-stack", className)}
      style={{ gap: space(gap), alignItems: align, ...style }}
      {...rest}
    />
  );
}

export type RowProps = BoxProps & {
  gap?: Space;
  wrap?: boolean;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
};

/** Children in a line, vertically centred unless `align` says otherwise. */
export function Row({
  gap,
  wrap,
  align,
  justify,
  as: Tag = "div",
  className,
  style,
  ...rest
}: RowProps) {
  return (
    <Tag
      className={cx("t-row", wrap && "t-row--wrap", className)}
      style={{ gap: space(gap), alignItems: align, justifyContent: justify, ...style }}
      {...rest}
    />
  );
}

export type GridProps = BoxProps & {
  /** The narrowest a column may get before the grid drops one; 240 px by default. */
  min?: number | string;
  gap?: Space;
  /** Stretches the columns over the whole row when there are fewer items than tracks. */
  fit?: boolean;
};

/** As many equal columns as fit, each at least `min` wide. */
export function Grid({ min, gap, fit, as: Tag = "div", className, style, ...rest }: GridProps) {
  const vars = {
    "--t-grid-min": typeof min === "number" ? `${min}px` : min,
    gap: space(gap),
    ...style,
  } as CSSProperties;
  return <Tag className={cx("t-grid", fit && "t-grid--fit", className)} style={vars} {...rest} />;
}

export type PageProps = BoxProps & {
  /** `narrow` caps the line length for reading; `wide` uses the shell's full width. */
  width?: "default" | "narrow" | "wide";
};

/** The padded, centred column inside `AppShell`. */
export function Page({ width = "default", as: Tag = "div", className, ...rest }: PageProps) {
  return (
    <Tag className={cx("t-page", width !== "default" && `t-page--${width}`, className)} {...rest} />
  );
}
