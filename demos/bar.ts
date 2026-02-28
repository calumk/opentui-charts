/**
 * Minimal Bar Chart demo
 * Run: bun run demos/bar.ts
 */
import { createCliRenderer } from "@opentui/core";
import { createBarChart } from "../src/index";

const renderer = await createCliRenderer({ exitOnCtrlC: true });

const chart = createBarChart(renderer, {
  width: renderer.width - 4,
  height: renderer.height - 4,
  title: "Bar Chart — Weekly Sales",
  series: [{ name: "Sales", data: [90, 120, 75, 140, 110, 95, 130], color: "#81C784" }],
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  grid: { show: true },
  backgroundColor: "#0D1117",
});

chart.position = "absolute";
chart.left = 2;
chart.top = 2;
renderer.root.add(chart);
