/**
 * Minimal Heatmap demo
 * Run: bun run demos/heatmap.ts
 */
import { createCliRenderer } from "@opentui/core";
import { createHeatmapChart } from "../src/index";

const renderer = await createCliRenderer({ exitOnCtrlC: true });

const chart = createHeatmapChart(renderer, {
  width: renderer.width - 4,
  height: renderer.height - 4,
  title: "Heatmap — Activity by Day",
  data: [
    [2, 5, 8, 3, 1, 9, 7],
    [6, 1, 4, 8, 5, 2, 3],
    [9, 7, 2, 5, 8, 4, 6],
    [3, 8, 6, 1, 4, 7, 9],
    [1, 4, 9, 7, 2, 5, 8],
  ],
  xLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  yLabels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
  showValues: true,
  backgroundColor: "#0D1117",
  margins: { left: 10, right: 2, top: 2, bottom: 3 },
});

chart.position = "absolute";
chart.left = 2;
chart.top = 2;
renderer.root.add(chart);
