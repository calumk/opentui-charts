/**
 * Minimal Gauge demo
 * Run: bun run demos/gauge.ts
 */
import { createCliRenderer } from "@opentui/core";
import { createGaugeChart } from "../src/index";

const renderer = await createCliRenderer({ exitOnCtrlC: true });

const chart = createGaugeChart(renderer, {
  width: renderer.width - 4,
  height: renderer.height - 4,
  title: "CPU Usage",
  value: 72,
  min: 0,
  max: 100,
  label: "72 %",
  thresholds: [
    { value: 50, color: "#2ECC71" },
    { value: 80, color: "#F39C12" },
    { value: 100, color: "#E74C3C" },
  ],
  backgroundColor: "#0D1117",
});

chart.position = "absolute";
chart.left = 2;
chart.top = 2;
renderer.root.add(chart);
