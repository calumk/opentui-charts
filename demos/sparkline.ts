/**
 * Minimal Sparkline demo
 * Run: bun run demos/sparkline.ts
 */
import { createCliRenderer } from "@opentui/core";
import { createSparkline } from "../src/index";

const renderer = await createCliRenderer({ exitOnCtrlC: true });

const chart = createSparkline(renderer, {
  width: renderer.width - 4,
  height: renderer.height - 4,
  title: "Latency (ms)",
  titleColor: "#61AFEF",
  data: [12, 15, 9, 18, 22, 14, 11, 26, 19, 13, 8, 17, 21, 10, 16, 24, 20, 15, 12, 28],
  color: "#98C379",
  backgroundColor: "#0D1117",
});

chart.position = "absolute";
chart.left = 2;
chart.top = 2;
renderer.root.add(chart);
