/**
 * Minimal Line Chart demo
 * Run: bun run demos/line.ts
 */
import { createCliRenderer } from "@opentui/core";
import { createLineChart } from "../src/index";

const renderer = await createCliRenderer({ exitOnCtrlC: true });

const chart = createLineChart(renderer, {
  width: renderer.width - 4,
  height: renderer.height - 4,
  title: "Line Chart — Monthly Revenue",
  series: [
    { name: "Revenue", data: [12, 28, 35, 47, 42, 55, 63, 58, 71, 80, 74, 92], color: "#4FC3F7" },
    { name: "Costs",   data: [8, 15, 22, 30, 35, 32, 40, 45, 50, 48, 52, 60], color: "#E57373" },
  ],
  showDots: true,
  grid: { show: true },
  backgroundColor: "#0D1117",
});

chart.position = "absolute";
chart.left = 2;
chart.top = 2;
renderer.root.add(chart);
