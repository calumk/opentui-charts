/**
 * Minimal Stacked Bar Chart demo
 * Run: bun run demos/stacked-bar.ts
 */
import { createCliRenderer } from "@opentui/core";
import { createStackedBarChart } from "../src/index";

const renderer = await createCliRenderer({ exitOnCtrlC: true });

const chart = createStackedBarChart(renderer, {
  width: renderer.width - 4,
  height: renderer.height - 4,
  title: "Stacked Bar Chart — Sprint Breakdown",
  series: [
    { name: "Bugs",     data: [15, 22, 18, 10, 8],  color: "#E57373" },
    { name: "Features", data: [30, 25, 35, 40, 45],  color: "#81C784" },
    { name: "Chores",   data: [10, 8, 12, 15, 10],   color: "#FFB74D" },
  ],
  labels: ["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4", "Sprint 5"],
  grid: { show: true },
  backgroundColor: "#0D1117",
});

chart.position = "absolute";
chart.left = 2;
chart.top = 2;
renderer.root.add(chart);
