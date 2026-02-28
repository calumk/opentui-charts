/**
 * @opentui-chart Demo
 * Showcases all chart types available in the plugin
 *
 * Run: bun run demo.ts
 */

import { createCliRenderer, Box, Text, type RenderContext } from "@opentui/core";
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

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
});

const termW = renderer.width;
const termH = renderer.height;

// ─── Dashboard Layout ───────────────────────────────────────────────────────

const chartW = Math.floor((termW - 4) / 2);
const chartH = Math.floor((termH - 6) / 2);

// Title
renderer.root.add(
  Text({
    content: "  📊 OpenTUI Charts Demo  ",
    fg: "#4FC3F7",
    position: "absolute",
    left: 2,
    top: 0,
  })
);

// ─── Line Chart (top-left) ─────────────────────────────────────────────────

const lineChart = createLineChart(renderer, {
  id: "line",
  width: chartW,
  height: chartH,
  title: "Line Chart — Monthly Revenue",
  series: [
    {
      name: "2025",
      data: [28, 47, 47, 40, 38, 35],
      color: "#4FC3F7",
    },
    {
      name: "2026",
      data: [32, 41, 55, 62, 58, 70],
      color: "#81C784",
    },
  ],
  lineStyle: "straight",
  showDots: true,
  grid: { show: true, style: "dotted" },
  margins: { left: 8, right: 2, top: 2, bottom: 3 },
  legend: { show: true },
  backgroundColor: "#111122",
});

lineChart.left = 2;
lineChart.top = 2;
lineChart.position = "absolute";
renderer.root.add(lineChart);

// ─── Bar Chart (top-right) ──────────────────────────────────────────────────

const barChart = createBarChart(renderer, {
  id: "bar",
  width: chartW,
  height: chartH,
  title: "Bar Chart — Quarterly Sales",
  series: [
    { name: "Product A", data: [65, 72, 89, 95, 110, 156], color: "#FFB74D" },
    { name: "Product B", data: [45, 56, 78, 82, 90, 102], color: "#4FC3F7" },
  ],
  labels: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"],
  grouped: true,
  grid: { show: true, style: "dotted" },
  margins: { left: 8, right: 2, top: 2, bottom: 3 },
  legend: { show: true },
  backgroundColor: "#111122",
});

barChart.left = chartW + 3;
barChart.top = 2;
barChart.position = "absolute";
renderer.root.add(barChart);

// ─── Pie Chart (bottom-left) ────────────────────────────────────────────────

const pieChart = createPieChart(renderer, {
  id: "pie",
  width: chartW,
  height: chartH,
  title: "Pie Chart — Market Share",
  slices: [
    { label: "Chrome", value: 65, color: "#4FC3F7" },
    { label: "Firefox", value: 12, color: "#FFB74D" },
    { label: "Safari", value: 18, color: "#81C784" },
    { label: "Edge", value: 5, color: "#E57373" },
  ],
  showPercentages: true,
  margins: { left: 2, right: 2, top: 2, bottom: 2 },
  backgroundColor: "#111122",
});

pieChart.left = 2;
pieChart.top = chartH + 3;
pieChart.position = "absolute";
renderer.root.add(pieChart);

// ─── Gauge Chart (bottom-right) ─────────────────────────────────────────────

const gaugeChart = createGaugeChart(renderer, {
  id: "gauge",
  width: chartW,
  height: chartH,
  title: "Gauge — CPU Usage",
  value: 73,
  min: 0,
  max: 100,
  label: "CPU %",
  showValue: true,
  thresholds: [
    { value: 0.5, color: "#4CAF50" },
    { value: 0.75, color: "#FFC107" },
    { value: 1.0, color: "#F44336" },
  ],
  margins: { left: 4, right: 4, top: 2, bottom: 2 },
  backgroundColor: "#111122",
});

gaugeChart.left = chartW + 3;
gaugeChart.top = chartH + 3;
gaugeChart.position = "absolute";
renderer.root.add(gaugeChart);

// ─── Status bar ─────────────────────────────────────────────────────────────

renderer.root.add(
  Text({
    content: "  Press Ctrl+C to exit  |  @opentui-chart demo  ",
    fg: "#555555",
    position: "absolute",
    left: 2,
    bottom: 0,
  })
);
