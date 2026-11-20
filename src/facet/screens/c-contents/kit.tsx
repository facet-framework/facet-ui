import type { ReactNode } from "react";
import { Screen, desktop, mobile, type ScreenProps } from "../Screen";

type Render = (mobile: boolean) => ReactNode;

export type PairOptions = Partial<Omit<ScreenProps, "children" | "mobile" | "area">>;

export function desk(area: string, name: string, render: Render, opts?: PairOptions) {
  return {
    ...desktop,
    name,
    render: () => (
      <Screen area={area} {...opts}>
        {render(false)}
      </Screen>
    ),
  };
}

export function mob(area: string, name: string, render: Render, opts?: PairOptions) {
  return {
    ...mobile,
    name: `${name} · Mobile`,
    render: () => (
      <Screen area={area} mobile {...opts}>
        {render(true)}
      </Screen>
    ),
  };
}

export const tablet = {
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "tablet" } },
} as const;

export function tab(area: string, name: string, render: Render, opts?: PairOptions) {
  return {
    ...tablet,
    name: `${name} · Tablet`,
    render: () => (
      <Screen area={area} {...opts}>
        {render(false)}
      </Screen>
    ),
  };
}
