import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { initialStatus, type IndexStatus } from "../../../core";
import IndexProgressWithLogic from ".";

const meta: Meta<typeof IndexProgressWithLogic> = {
  title: "States/IndexProgress",
  component: IndexProgressWithLogic,
  parameters: {
    docs: {},
  },
  args: { status: initialStatus() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Connection: Story = {};

export const Records: Story = {
  args: {
    root: "/projects/taskflow",
    status: {
      ...initialStatus(),
      phase: "records",
      file: "docs/facets/features/sync/queue/offline-queue.yaml",
      done: 7,
      total: 17,
      records: 7,
    },
  },
};

export const Count: Story = {
  args: {
    status: {
      ...initialStatus(),
      phase: "enumerate",
      file: "crates/sync/src/lib.rs",
      done: 812,
      records: 17,
    },
  },
};

export const Anchor: Story = {
  args: {
    root: "/projects/taskflow",
    registry: "storefront",
    status: {
      ...initialStatus(),
      phase: "index",
      file: "packages/core/src/reminders/due.ts",
      done: 1204,
      total: 2481,
      records: 17,
      files: 1204,
      anchors: 37,
    },
  },
};

export const Done: Story = {
  args: {
    status: {
      ...initialStatus(),
      phase: "ready",
      records: 17,
      files: 2481,
      anchors: 37,
    },
  },
};

export const Walkthrough: Story = {
  render: () => {
    const Demo = () => {
      const [status, setStatus] = useState<IndexStatus>(initialStatus());

      useEffect(() => {
        const steps = scriptedRun();
        let index = 0;
        const timer = setInterval(() => {
          setStatus(steps[index]);
          index += 1;
          if (index >= steps.length) clearInterval(timer);
        }, 180);
        return () => clearInterval(timer);
      }, []);

      return <IndexProgressWithLogic status={status} root="/projects/taskflow" />;
    };

    return <Demo />;
  },
};

function scriptedRun(): IndexStatus[] {
  const base = initialStatus();
  const steps: IndexStatus[] = [{ ...base, phase: "config", file: ".facetrc.yaml" }];

  const records = [
    "docs/facets/features/tasks/create/quick-add.yaml",
    "docs/facets/features/sync/queue/offline-queue.yaml",
    "docs/facets/policies/notifications/quiet-hours.yaml",
    "docs/facets/data/tasks/task-item.yaml",
  ];
  records.forEach((file, i) =>
    steps.push({
      ...base,
      phase: "records",
      file,
      done: i + 1,
      total: records.length,
      records: i + 1,
    }),
  );

  const sources = [
    "apps/mobile/src/tasks/quick_add.ts",
    "packages/core/src/lists/store.ts",
    "crates/sync/src/queue.rs",
    "apps/web/src/lists/sharing.tsx",
  ];
  sources.forEach((file, i) =>
    steps.push({ ...base, phase: "enumerate", file, done: (i + 1) * 210, records: records.length }),
  );
  sources.forEach((file, i) =>
    steps.push({
      ...base,
      phase: "index",
      file,
      done: (i + 1) * 210,
      total: 840,
      records: records.length,
      files: (i + 1) * 210,
      anchors: (i + 1) * 9,
    }),
  );

  steps.push({ ...base, phase: "model", records: records.length, files: 840, anchors: 36 });
  steps.push({ ...base, phase: "ready", records: records.length, files: 840, anchors: 36 });
  return steps;
}
