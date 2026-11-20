import { useRef, type ReactNode } from "react";
import { useHeightVar } from "./bars";
import { TooltipLayer } from "../primitives/tooltip";
export type AppShellProps = {
  top: ReactNode;
  nav?: ReactNode;
  tabbar?: ReactNode;
  children: ReactNode;
  overlay?: ReactNode;
  chat?: ReactNode;
  /** Without a theme the shell inherits the palette of its ancestor. */
  theme?: { theme: "facet" | "paper"; mode: "dark" | "light" };
  /** Mobile layout: no nav bar, a tab bar at the bottom. */
  mobile?: boolean;
  /** Focus mode: a wide page in larger type; what has neither pointer nor focus blurs. */
  focus?: boolean;
  /** Spacing of the whole shell: the `--t-s-*` steps shrink or grow; absent is normal. */
  density?: "compact" | "normal" | "spacious";
  /** Reduced: nothing in the shell animates or transitions. */
  reducedMotion?: boolean;
  /**
   * A modal overlay is open (the palette): the bars, the page, the tab bar and
   * the chat are inert — neither focusable nor read — until it closes.
   */
  modal?: boolean;
};

export function AppShell({
  top,
  nav,
  tabbar,
  children,
  overlay,
  chat,
  theme,
  mobile,
  focus,
  density,
  reducedMotion,
  modal,
}: AppShellProps) {
  // The head's real height, for everything that sticks or lands below it.
  const shell = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  useHeightVar("--t-bars-h", head, shell, mobile);
  return (
    <div
      ref={shell}
      className="t-app t-shell"
      data-testid="app-shell"
      data-t-theme={theme?.theme}
      data-t-mode={theme?.mode}
      data-layout={mobile ? "mobile" : "desktop"}
      data-focus={focus ? "on" : undefined}
      data-density={density && density !== "normal" ? density : undefined}
      data-motion={reducedMotion ? "reduced" : undefined}
    >
      <div className="t-shell__head" ref={head} data-testid="shell-head" inert={modal}>
        {top}
        {!mobile && nav ? <div className="t-shell__nav">{nav}</div> : null}
      </div>
      <main className="t-shell__main t-dotted" inert={modal}>
        {children}
      </main>
      {/* Contents-only wrappers: they carry inertness without a box of their own. */}
      <div className="t-shell__part" data-testid="shell-chrome" inert={modal}>
        {mobile ? tabbar : null}
        {chat}
      </div>
      {overlay}
      {/* Every `title` inside the shell, an IconButton's label included, gets a tooltip the keyboard reaches. */}
      <TooltipLayer />
    </div>
  );
}
