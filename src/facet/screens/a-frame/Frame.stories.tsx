import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Screen, desktop, mobile } from "../Screen";
import { MoreSheet } from "../../shell/Shell";
import { useText } from "../../i18n/TextProvider";
import { HISTORY, useNav, useRoles } from "../../fixtures/shell";
import { OverviewPage, type OverviewRole } from "./OverviewPage";
import { EmptyHistoryHint, PlacesOverlay, PlacesSheet } from "./StatusPages";
import { TEAM_NAMES, overviewModel, manyPlaces, reader } from "./data";

const meta: Meta = { title: "Screens/A Frame/Frame" };
export default meta;
type Story = StoryObj;

const M = overviewModel();
const MANY = manyPlaces(64);

function Page({ who: role = "leadership", mobile }: { who?: OverviewRole; mobile?: boolean }) {
  return <OverviewPage reader={role} model={M} mobile={mobile} teamNames={TEAM_NAMES} />;
}

function Standard({ mobile }: { mobile?: boolean }) {
  return (
    <Screen area="overview" mobile={mobile} {...reader("leadership")}>
      <Page mobile={mobile} />
    </Screen>
  );
}

function FewPlaces({ mobile }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <Screen
        area="overview"
        mobile
        {...reader("leadership")}
        overlay={<PlacesSheet entries={HISTORY} filter="" />}
      >
        <Page mobile />
      </Screen>
    );
  }
  return (
    <Screen area="overview" {...reader("leadership")} historyOpen history={HISTORY}>
      <Page />
    </Screen>
  );
}

function ManyPlaces({ mobile }: { mobile?: boolean }) {
  const [filter, setFilter] = useState("board");
  return (
    <Screen
      area="overview"
      mobile={mobile}
      {...reader("leadership")}
      history={MANY}
      overlay={
        mobile ? (
          <PlacesSheet entries={MANY} filter={filter} onFilter={setFilter} />
        ) : (
          <PlacesOverlay entries={MANY} filter={filter} onFilter={setFilter} />
        )
      }
    >
      <Page mobile={mobile} />
    </Screen>
  );
}

function EmptyHistory({ mobile }: { mobile?: boolean }) {
  return (
    <Screen
      area="overview"
      mobile={mobile}
      {...reader("leadership")}
      canBack={false}
      canForward={false}
      history={[]}
      overlay={mobile ? undefined : <EmptyHistoryHint />}
    >
      <Page mobile={mobile} />
    </Screen>
  );
}

function RolePick({ mobile }: { mobile?: boolean }) {
  const [role, setRole] = useState<OverviewRole>("developer");
  if (mobile) return <More mobile role={role} onRole={(k) => setRole(k as OverviewRole)} />;
  return (
    <Screen area="overview" {...reader(role)} roleOpen>
      <Page who={role} />
    </Screen>
  );
}

function More({
  mobile,
  role = "leadership",
  onRole,
}: {
  mobile?: boolean;
  role?: OverviewRole;
  onRole?: (key: string) => void;
}) {
  const [light, setLight] = useState(false);
  const nav = useNav();
  const { t } = useText();
  const roles = useRoles();
  const name = roles.find((r) => r.key === role)!.name;
  return (
    <Screen
      area="more"
      mobile={mobile}
      {...reader(role)}
      overlay={
        <MoreSheet
          open
          items={nav}
          roleName={name}
          roles={roles}
          currentRole={role}
          theme={
            light
              ? { label: t("shell.theme.dark"), icon: "moon" }
              : { label: t("shell.theme.light"), icon: "sun" }
          }
          onRole={onRole}
          onTheme={() => setLight((h) => !h)}
          onSettings={() => undefined}
        />
      }
    >
      <Page who={role} mobile={mobile} />
    </Screen>
  );
}

export const TopBarStandard: Story = {
  ...desktop,
  render: () => <Standard />,
};
export const TopBarStandardMobile: Story = {
  ...mobile,
  render: () => <Standard mobile />,
};
export const PlacesFew: Story = {
  ...desktop,
  name: "Places Few",
  render: () => <FewPlaces />,
};
export const PlacesFewMobile: Story = {
  ...mobile,
  name: "Places Few Mobile",
  render: () => <FewPlaces mobile />,
};
export const PlacesMany: Story = {
  ...desktop,
  name: "Places Many",
  render: () => <ManyPlaces />,
};
export const PlacesManyMobile: Story = {
  ...mobile,
  name: "Places Many Mobile",
  render: () => <ManyPlaces mobile />,
};
export const HistoryEmpty: Story = {
  ...desktop,
  name: "History Empty",
  render: () => <EmptyHistory />,
};
export const HistoryEmptyMobile: Story = {
  ...mobile,
  name: "History Empty Mobile",
  render: () => <EmptyHistory mobile />,
};
export const RolePickerOpen: Story = {
  ...desktop,
  name: "Role Picker Open",
  render: () => <RolePick />,
};
export const RolePickerOpenMobile: Story = {
  ...mobile,
  name: "Role Picker Open Mobile",
  render: () => <RolePick mobile />,
};
export const MoreSheetMobile: Story = {
  ...mobile,
  name: "More Sheet Mobile",
  render: () => <More mobile />,
};
