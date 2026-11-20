import type { Meta, StoryObj } from "@storybook/react-vite";
import { Screen, desktop, mobile } from "../Screen";
import { reader } from "./data";
import { OverviewPage } from "./OverviewPage";
import { ConnectionBanner, NotFoundPage, StaleFrame } from "./StatusPages";
import { TEAM_NAMES, overviewModel } from "./data";

const meta: Meta = { title: "Screens/A Frame/Error" };
export default meta;
type Story = StoryObj;

const M = overviewModel();

function Offline({ mobile }: { mobile?: boolean }) {
  return (
    <Screen area="overview" mobile={mobile} {...reader("developer")}>
      <ConnectionBanner
        since="14:12:06"
        attempt={4}
        nextRetryIn={8}
        lastGood="14:11:58"
        endpoint="127.0.0.1:7878"
        onRetry={() => undefined}
        onDismiss={() => undefined}
      />
      <StaleFrame>
        <OverviewPage reader="developer" model={M} mobile={mobile} teamNames={TEAM_NAMES} />
      </StaleFrame>
    </Screen>
  );
}

const NEAR = [
  {
    id: "workspace/board/column",
    label: "workspace/board/column",
    sub: "Record · Atlas reader",
    distance: 2,
  },
  {
    id: "workspace/board/card",
    label: "workspace/board/card",
    sub: "Record · Atlas reader",
    distance: 4,
  },
  {
    id: "lists/permissions/role",
    label: "lists/permissions/role",
    sub: "Record · Guardrails",
    distance: 9,
  },
];

function Missing({ mobile }: { mobile?: boolean }) {
  return (
    <Screen area="records" mobile={mobile} {...reader("developer")}>
      <NotFoundPage path="/record/workspace/board/columns" kind="Record" suggestions={NEAR} />
    </Screen>
  );
}

export const ConnectionLost: Story = {
  ...desktop,
  name: "Connection Lost",
  render: () => <Offline />,
};
export const ConnectionLostMobile: Story = {
  ...mobile,
  name: "Connection Lost Mobile",
  render: () => <Offline mobile />,
};
export const NotFound: Story = {
  ...desktop,
  name: "Not Found",
  render: () => <Missing />,
};
export const NotFoundMobile: Story = {
  ...mobile,
  name: "Not Found Mobile",
  render: () => <Missing mobile />,
};
