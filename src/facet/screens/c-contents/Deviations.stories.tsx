import type { Meta } from "@storybook/react-vite";
import { DeviationsPage } from "./Evidence";
import { deviations, promiseTotals } from "./data";
import { desk, mob } from "./kit";

const meta: Meta = { title: "Screens/C Contents/Deviations" };
export default meta;

const empty = () => <DeviationsPage state="empty" items={[]} promises={promiseTotals.total} />;
const list = () => (
  <DeviationsPage state="ready" items={deviations} promises={promiseTotals.total} />
);

export const Empty = desk("contents", "Empty", empty);
export const EmptyMobile = mob("contents", "Empty Mobile", empty);
export const List = desk("contents", "List", list);
export const ListMobile = mob("contents", "List Mobile", list);
