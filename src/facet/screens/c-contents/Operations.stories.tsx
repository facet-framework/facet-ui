import type { Meta } from "@storybook/react-vite";
import { OperationsPage } from "./Registry";
import { opsEntries, promiseTotals } from "./data";
import { desk, mob } from "./kit";

const meta: Meta = { title: "Screens/C Contents/Operations" };
export default meta;

const list = () => (
  <OperationsPage state="ready" entries={opsEntries} records={promiseTotals.records} />
);
const empty = () => <OperationsPage state="empty" entries={[]} records={promiseTotals.records} />;

export const List = desk("contents", "List", list);
export const ListMobile = mob("contents", "List Mobile", list);
export const Empty = desk("contents", "Empty", empty);
export const EmptyMobile = mob("contents", "Empty Mobile", empty);
