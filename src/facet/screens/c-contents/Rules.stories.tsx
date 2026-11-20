import type { Meta } from "@storybook/react-vite";
import { useState } from "react";
import { RulesPage } from "./Code";
import { promiseTotals, rules } from "./data";
import { desk, mob } from "./kit";

const meta: Meta = { title: "Screens/C Contents/Rules" };
export default meta;

function Demo({ empty }: { empty?: boolean }) {
  const [sel, setSel] = useState<string | null>(rules[2].id);
  return (
    <RulesPage
      state={empty ? "empty" : "ready"}
      items={empty ? [] : rules}
      records={promiseTotals.records}
      selected={sel}
      onSelect={setSel}
    />
  );
}

export const Empty = desk("contents", "Empty", () => <Demo empty />);
export const EmptyMobile = mob("contents", "Empty Mobile", () => <Demo empty />);
export const List = desk("contents", "List", () => <Demo />);
export const ListMobile = mob("contents", "List Mobile", () => <Demo />);
