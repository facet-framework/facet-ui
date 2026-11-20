import type { Meta } from "@storybook/react-vite";
import { useState } from "react";
import { FixedPage, type FixedView } from "./Evidence";
import { fixes } from "./data";
import { desk, mob } from "./kit";

const meta: Meta = { title: "Screens/C Contents/Fixes" };
export default meta;

function Demo({ initial }: { initial: FixedView }) {
  const [view, setView] = useState(initial);
  const [domain, setDomain] = useState<string | null>(null);
  return (
    <FixedPage view={view} commits={fixes} domain={domain} onView={setView} onDomain={setDomain} />
  );
}

export const Timeline = desk("contents", "Timeline", () => <Demo initial="time" />);
export const TimelineMobile = mob("contents", "Timeline Mobile", () => <Demo initial="time" />);
export const ByArea = desk("contents", "By Area", () => <Demo initial={"area"} />);
export const ByAreaMobile = mob("contents", "By Area Mobile", () => <Demo initial={"area"} />);
