import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { TextProvider } from "./TextProvider";

function German({ children }: { children: ReactNode }) {
  return <TextProvider locale="de">{children}</TextProvider>;
}

/**
 * `render` inside the German provider, for specs that assert German texts.
 * Test-only: not exported from the package. `rerender` keeps the wrapper.
 */
export function renderInGerman(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
  return render(ui, { ...options, wrapper: German });
}
