import type { Meta } from "@storybook/react-vite";
import { ContentsHub } from "./Hub";
import { useText } from "../../i18n/TextProvider";
import { contentKindsFor, hubHeadlineFor } from "./data";
import { desk, mob } from "./kit";

const meta: Meta = { title: "Screens/C Contents/Contents" };
export default meta;

function Hub() {
  const { t } = useText();
  return <ContentsHub state="ready" kinds={contentKindsFor(t)} headline={hubHeadlineFor(t)} />;
}
const hub = () => <Hub />;
const loading = () => <ContentsHub state="loading" kinds={[]} />;

export const Overview = desk("contents", "Overview", hub);
export const OverviewMobile = mob("contents", "Overview Mobile", hub);
export const Loading = desk("contents", "Loading", loading);
export const LoadingMobile = mob("contents", "Loading Mobile", loading);
