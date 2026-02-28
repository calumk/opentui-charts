/**
 * Minimal Pie Chart demo
 * Run: bun run demos/pie.ts
 */
import { createCliRenderer } from "@opentui/core";
import { createPieChart } from "../src/index";

const renderer = await createCliRenderer({ exitOnCtrlC: true });

const chart = createPieChart(renderer, {
  width: renderer.width - 4,
  height: renderer.height - 4,
  title: "Pie Chart — Language Usage",
  slices: [
    { label: "TypeScript", value: 45, color: "#3178C6" },
    { label: "Zig",        value: 30, color: "#F7A41D" },
    { label: "MDX",        value: 10, color: "#FCB32C" },
    { label: "Other",      value: 15, color: "#888888" },
  ],
  showPercentages: true,
  backgroundColor: "#0D1117",
});

chart.position = "absolute";
chart.left = 2;
chart.top = 2;
renderer.root.add(chart);
