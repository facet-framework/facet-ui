import type { Meta } from "@storybook/react-vite";
import { useState } from "react";
import { CalibrationPage, type CalibrationView } from "./Structure";
import { calibration, outliers } from "./data";
import { desk, mob } from "./kit";

const meta: Meta = { title: "Screens/C Contents/Calibration" };
export default meta;

function Demo({ initial }: { initial: CalibrationView }) {
  const [view, setView] = useState(initial);
  const [metric, setMetric] = useState(calibration[0].key);
  return (
    <CalibrationPage
      view={view}
      metrics={calibration}
      outliers={outliers}
      metric={metric}
      onView={setView}
      onMetric={setMetric}
    />
  );
}

export const Bands = desk("contents", "Bands", () => <Demo initial="bands" />);
export const BandsMobile = mob("contents", "Bands Mobile", () => <Demo initial="bands" />);
export const Outliers = desk("contents", "Outliers", () => <Demo initial="outliers" />);
export const OutliersMobile = mob("contents", "Outliers Mobile", () => <Demo initial="outliers" />);
