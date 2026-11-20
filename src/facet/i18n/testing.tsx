import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { FacetTextProvider } from "./TextProvider";

function German({ children }: { children: ReactNode }) {
  return <FacetTextProvider locale="de">{children}</FacetTextProvider>;
}

export function renderInGerman(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
  return render(ui, { ...options, wrapper: German });
}
