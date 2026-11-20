import type { ReactNode } from "react";
import {
  AppShell,
  MobileTabBar,
  NavBar,
  RoleMenu,
  TopBar,
  type HistoryEntry,
  type TopBarStats,
} from "../shell/Shell";
import { useText } from "../i18n/TextProvider";
import { HISTORY, useNav, useRoles } from "../fixtures/shell";
import { TOP_STATS } from "../fixtures/summary";

export type ScreenProps = {
  area: string;
  mobile?: boolean;
  children: ReactNode;

  chat?: ReactNode;

  overlay?: ReactNode;
  historyOpen?: boolean;
  history?: HistoryEntry[];
  canBack?: boolean;
  canForward?: boolean;
  roleOpen?: boolean;
  role?: string;
  theme?: { theme: "facet" | "paper"; mode: "dark" | "light" };

  stats?: TopBarStats | null;

  badges?: Record<string, number> | null;
};

const MOBILE_TABS = [
  { key: "overview", text: "shell.nav.item.overview", icon: "home" },
  { key: "product", text: "shell.nav.item.product", icon: "product" },
  { key: "records", text: "shell.nav.item.records", icon: "records" },
  { key: "ask", text: "shell.tab.ask", icon: "chat" },
  { key: "more", text: "shell.tab.more", icon: "menu" },
] as const;

export function Screen({
  area,
  mobile,
  children,
  chat,
  overlay,
  historyOpen,
  history = HISTORY,
  canBack = true,
  canForward = false,
  roleOpen,
  role = "developer",
  theme,
  stats = TOP_STATS,
  badges,
}: ScreenProps) {
  const { t } = useText();
  const nav = useNav();
  const roles = useRoles();
  const roleName = roles.find((r) => r.key === role)?.name ?? role;
  const inTabs = MOBILE_TABS.some((tab) => tab.key === area);
  return (
    <AppShell
      mobile={mobile}
      theme={theme}
      top={
        <TopBar
          compact={mobile}
          canBack={canBack}
          canForward={canForward}
          historyOpen={historyOpen}
          history={{ entries: history }}
          stats={stats ?? undefined}
          roleName={roleName}
          roleOpen={roleOpen}
          roleMenu={<RoleMenu roles={roles} current={role} />}
          theme={
            theme?.mode === "light"
              ? { label: t("shell.theme.dark"), icon: "moon" }
              : { label: t("shell.theme.light"), icon: "sun" }
          }
        />
      }
      nav={
        <NavBar
          items={nav.map((n) => ({
            ...n,
            current: n.key === area,
            badge: badges === null ? undefined : (badges?.[n.key] ?? n.badge),
          }))}
        />
      }
      tabbar={
        <MobileTabBar
          items={MOBILE_TABS.map((tab) => ({
            key: tab.key,
            label: t(tab.text),
            icon: tab.icon,
            current: tab.key === area || (!inTabs && tab.key === "more"),
          }))}
        />
      }
      chat={chat}
      overlay={overlay}
    >
      {children}
    </AppShell>
  );
}

export const desktop = {
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "desktop" } },
} as const;
export const mobile = {
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "mobile" } },
} as const;
