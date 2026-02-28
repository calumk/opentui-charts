/**
 * Minimal Scatter Chart demo
 * Run: bun run demos/scatter.ts
 */
import { createCliRenderer } from "@opentui/core";
import { createScatterChart } from "../src/index";

const renderer = await createCliRenderer({ exitOnCtrlC: true });

const colors = ["#4FC3F7", "#81C784", "#FFB74D", "#E57373"];
const points = Array.from({ length: 50 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  color: colors[Math.floor(Math.random() * colors.length)],
}));

const chart = createScatterChart(renderer, {
  width: renderer.width - 4,
  height: renderer.height - 4,
  title: "Scatter Chart — Random Distribution",
  points,
  grid: { show: true },
  backgroundColor: "#0D1117",
});

chart.position = "absolute";
chart.left = 2;
chart.top = 2;
renderer.root.add(chart);
