/**
 * Minimal Area Chart demo
 * Run: bun run demos/area.ts
 */
import { createCliRenderer } from "@opentui/core";
import { createAreaChart } from "../src/index";

const renderer = await createCliRenderer({ exitOnCtrlC: true });

const chart = createAreaChart(renderer, {
  width: renderer.width - 4,
  height: renderer.height - 4,
  title: "Area Chart — Team Output (Stacked)",
  series: [
    { name: "Frontend", data: [20, 35, 30, 45, 50, 55, 60, 58, 65], color: "#4FC3F7" },
    { name: "Backend",  data: [15, 20, 25, 30, 35, 30, 40, 38, 42], color: "#81C784" },
    { name: "DevOps",   data: [5, 10, 15, 12, 18, 22, 20, 25, 28],  color: "#FFB74D" },
  ],
  stacked: true,
  grid: { show: true },
  backgroundColor: "#0D1117",
});

chart.position = "absolute";
chart.left = 2;
chart.top = 2;
renderer.root.add(chart);
