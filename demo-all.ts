/**
 * @opentui-chart — All chart types demo
 * Run: bun run demo-all.ts
 *
 * Shows every chart type one at a time (press any key to cycle)
 */

import { createCliRenderer, Text } from "@opentui/core";
import {
  createLineChart,
  createBarChart,
  createPieChart,
  createScatterChart,
  createSparkline,
  createGaugeChart,
  createHeatmapChart,
  createAreaChart,
  createStackedBarChart,
} from "./src/index";

const renderer = await createCliRenderer({ exitOnCtrlC: true });
const W = Math.min(renderer.width - 4, 80);
const H = Math.min(renderer.height - 4, 24);

const charts = [
  () =>
    createLineChart(renderer, {
      width: W,
      height: H,
      title: "1/9 — Line Chart",
      series: [
        { name: "Revenue", data: [12, 28, 35, 47, 42, 55, 63, 58, 71, 80], color: "#4FC3F7" },
        { name: "Costs", data: [8, 15, 22, 30, 35, 32, 40, 45, 50, 48], color: "#E57373" },
      ],
      showDots: true,
      grid: { show: true },
      backgroundColor: "#0D1117",
    }),

  () =>
    createBarChart(renderer, {
      width: W,
      height: H,
      title: "2/9 — Bar Chart",
      series: [
        { name: "Sales", data: [90, 120, 75, 140, 110, 95, 130], color: "#81C784" },
      ],
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      grid: { show: true },
      backgroundColor: "#0D1117",
    }),

  () =>
    createPieChart(renderer, {
      width: W,
      height: H,
      title: "3/9 — Pie Chart",
      slices: [
        { label: "TypeScript", value: 45, color: "#3178C6" },
        { label: "Zig", value: 30, color: "#F7A41D" },
        { label: "MDX", value: 10, color: "#FCB32C" },
        { label: "Other", value: 15, color: "#888888" },
      ],
      showPercentages: true,
      backgroundColor: "#0D1117",
    }),

  () =>
    createScatterChart(renderer, {
      width: W,
      height: H,
      title: "4/9 — Scatter Chart",
      points: Array.from({ length: 40 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: ["#4FC3F7", "#81C784", "#FFB74D", "#E57373"][Math.floor(Math.random() * 4)],
      })),
      grid: { show: true },
      backgroundColor: "#0D1117",
    }),

  () =>
    createAreaChart(renderer, {
      width: W,
      height: H,
      title: "5/9 — Area Chart (Stacked)",
      series: [
        { name: "Frontend", data: [20, 35, 30, 45, 50, 55, 60], color: "#4FC3F7" },
        { name: "Backend", data: [15, 20, 25, 30, 35, 30, 40], color: "#81C784" },
        { name: "DevOps", data: [5, 10, 15, 12, 18, 22, 20], color: "#FFB74D" },
      ],
      stacked: true,
      grid: { show: true },
      backgroundColor: "#0D1117",
    }),

  () =>
    createStackedBarChart(renderer, {
      width: W,
      height: H,
      title: "6/9 — Stacked Bar Chart",
      series: [
        { name: "Bugs", data: [15, 22, 18, 10, 8], color: "#E57373" },
        { name: "Features", data: [30, 25, 35, 40, 45], color: "#81C784" },
        { name: "Chores", data: [10, 8, 12, 15, 10], color: "#FFB74D" },
      ],
      labels: ["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4", "Sprint 5"],
      grid: { show: true },
      backgroundColor: "#0D1117",
    }),

  () =>
    createHeatmapChart(renderer, {
      width: W,
      height: H,
      title: "7/9 — Heatmap",
      data: [
        [2, 5, 8, 3, 1, 9, 7],
        [6, 1, 4, 8, 5, 2, 3],
        [9, 7, 2, 5, 8, 4, 6],
        [3, 8, 6, 1, 4, 7, 9],
        [1, 4, 9, 7, 2, 5, 8],
      ],
      xLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      yLabels: ["Week1", "Week2", "Week3", "Week4", "Week5"],
      showValues: true,
      backgroundColor: "#0D1117",
      margins: { left: 8, right: 2, top: 2, bottom: 3 },
    }),

  () =>
    createGaugeChart(renderer, {
      width: W,
      height: H,
      title: "8/9 — Gauge Chart",
      value: 72,
      min: 0,
      max: 100,
      label: "Performance Score",
      showValue: true,
      thresholds: [
        { value: 0.4, color: "#F44336" },
        { value: 0.7, color: "#FFC107" },
        { value: 1.0, color: "#4CAF50" },
      ],
      backgroundColor: "#0D1117",
    }),

  () =>
    createSparkline(renderer, {
      width: W,
      height: H,
      data: [3, 7, 2, 9, 5, 8, 1, 6, 4, 10, 3, 7, 5, 8, 2, 9, 6, 4, 7, 3, 8, 5, 10, 2, 6],
      color: "#4FC3F7",
      style: "line",
      showMinMax: true,
      title: "9/9 — Sparkline",
      backgroundColor: "#0D1117",
    }),
];

let currentIdx = -1; // -1 = overview grid, 0–8 = individual charts
let currentCharts: any[] = [];

// Grid layout for overview page
const gridCols = 3;
const gridRows = 3;
const gridPad = 1;
const gridCellW = Math.floor((renderer.width - gridPad * (gridCols + 1)) / gridCols);
const gridCellH = Math.floor((renderer.height - gridPad * (gridRows + 1) - 1) / gridRows);
const gridSlots: [number, number][] = [
  [0, 0], [1, 0], [2, 0],
  [0, 1], [1, 1], [2, 1],
  [0, 2], [1, 2], [2, 2],
];

// Grid-sized chart factories (same data, smaller size)
const gridCharts = [
  () => createLineChart(renderer, { width: gridCellW, height: gridCellH, title: "1 — Line",
    series: [
      { name: "Revenue", data: [12, 28, 35, 47, 42, 55, 63, 58, 71, 80], color: "#4FC3F7" },
      { name: "Costs", data: [8, 15, 22, 30, 35, 32, 40, 45, 50, 48], color: "#E57373" },
    ], showDots: true, grid: { show: true }, backgroundColor: "#0D1117" }),
  () => createBarChart(renderer, { width: gridCellW, height: gridCellH, title: "2 — Bar",
    series: [{ name: "Sales", data: [90, 120, 75, 140, 110, 95, 130], color: "#81C784" }],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], grid: { show: true }, backgroundColor: "#0D1117" }),
  () => createPieChart(renderer, { width: gridCellW, height: gridCellH, title: "3 — Pie",
    slices: [
      { label: "TS", value: 45, color: "#3178C6" }, { label: "Zig", value: 30, color: "#F7A41D" },
      { label: "MDX", value: 10, color: "#FCB32C" }, { label: "Other", value: 15, color: "#888888" },
    ], showPercentages: true, backgroundColor: "#0D1117" }),
  () => createScatterChart(renderer, { width: gridCellW, height: gridCellH, title: "4 — Scatter",
    points: Array.from({ length: 40 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      color: ["#4FC3F7", "#81C784", "#FFB74D", "#E57373"][Math.floor(Math.random() * 4)],
    })), grid: { show: true }, backgroundColor: "#0D1117" }),
  () => createAreaChart(renderer, { width: gridCellW, height: gridCellH, title: "5 — Area",
    series: [
      { name: "Frontend", data: [20, 35, 30, 45, 50, 55, 60], color: "#4FC3F7" },
      { name: "Backend", data: [15, 20, 25, 30, 35, 30, 40], color: "#81C784" },
      { name: "DevOps", data: [5, 10, 15, 12, 18, 22, 20], color: "#FFB74D" },
    ], stacked: true, grid: { show: true }, backgroundColor: "#0D1117" }),
  () => createStackedBarChart(renderer, { width: gridCellW, height: gridCellH, title: "6 — Stacked",
    series: [
      { name: "Bugs", data: [15, 22, 18, 10, 8], color: "#E57373" },
      { name: "Features", data: [30, 25, 35, 40, 45], color: "#81C784" },
      { name: "Chores", data: [10, 8, 12, 15, 10], color: "#FFB74D" },
    ], labels: ["S1", "S2", "S3", "S4", "S5"], grid: { show: true }, backgroundColor: "#0D1117" }),
  () => createHeatmapChart(renderer, { width: gridCellW, height: gridCellH, title: "7 — Heatmap",
    data: [[2,5,8,3,1,9,7],[6,1,4,8,5,2,3],[9,7,2,5,8,4,6],[3,8,6,1,4,7,9],[1,4,9,7,2,5,8]],
    xLabels: ["M","T","W","T","F","S","S"], yLabels: ["W1","W2","W3","W4","W5"],
    showValues: false, backgroundColor: "#0D1117" }),
  () => createGaugeChart(renderer, { width: gridCellW, height: gridCellH, title: "8 — Gauge",
    value: 72, min: 0, max: 100, label: "Score", showValue: true,
    thresholds: [{ value: 0.4, color: "#F44336" }, { value: 0.7, color: "#FFC107" }, { value: 1.0, color: "#4CAF50" }],
    backgroundColor: "#0D1117" }),
  () => createSparkline(renderer, { width: gridCellW, height: gridCellH,
    data: [3,7,2,9,5,8,1,6,4,10,3,7,5,8,2,9,6,4,7,3,8,5,10,2,6],
    color: "#4FC3F7", style: "line", showMinMax: true, title: "9 — Sparkline", backgroundColor: "#0D1117" }),
];

function teardown() {
  for (const c of currentCharts) {
    renderer.root.remove(c);
    c.destroy?.();
  }
  currentCharts = [];
}

function showChart(idx: number) {
  teardown();
  currentIdx = idx;

  if (idx === -1) {
    // Overview grid — all 9 charts
    for (let i = 0; i < 9; i++) {
      const [col, row] = gridSlots[i];
      const chart = gridCharts[i]();
      chart.position = "absolute";
      chart.left = gridPad + col * (gridCellW + gridPad);
      chart.top = gridPad + row * (gridCellH + gridPad);
      renderer.root.add(chart);
      currentCharts.push(chart);
    }
  } else {
    // Full-screen individual chart
    const chart = charts[idx]();
    chart.position = "absolute";
    chart.left = 2;
    chart.top = 2;
    renderer.root.add(chart);
    currentCharts.push(chart);
  }
}

const TOTAL = charts.length; // 9

renderer.root.add(
  Text({
    content: "←/→ or SPACE to navigate  |  Ctrl+C to exit",
    fg: "#555555",
    position: "absolute",
    left: 2,
    bottom: 0,
  })
);

showChart(-1); // Start on overview

renderer.keyInput.on("keypress", (key: any) => {
  if (key.name === "right" || key.name === "space" || key.name === "return") {
    showChart(currentIdx === TOTAL - 1 ? -1 : currentIdx + 1);
  } else if (key.name === "left") {
    showChart(currentIdx === -1 ? TOTAL - 1 : currentIdx - 1);
  }
});
