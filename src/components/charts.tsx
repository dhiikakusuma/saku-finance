import React from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polyline,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { colors } from "@/theme";

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

type DonutProps = {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
};

/**
 * Simple donut chart built on react-native-svg.
 * Renders an arc per slice; gracefully handles total=0 with a placeholder ring.
 */
export function DonutChart({
  data,
  size = 200,
  strokeWidth = 28,
  centerLabel,
  centerValue,
}: DonutProps) {
  const radius = size / 2 - strokeWidth / 2;
  const cx = size / 2;
  const cy = size / 2;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const slices = React.useMemo(() => {
    if (total <= 0) return [];
    let angle = -Math.PI / 2; // start at top
    return data
      .filter((d) => d.value > 0)
      .map((d) => {
        const slice = (d.value / total) * Math.PI * 2;
        const start = angle;
        const end = angle + slice;
        angle = end;
        const x1 = cx + radius * Math.cos(start);
        const y1 = cy + radius * Math.sin(start);
        const x2 = cx + radius * Math.cos(end);
        const y2 = cy + radius * Math.sin(end);
        const largeArc = slice > Math.PI ? 1 : 0;
        const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
        return { d, path };
      });
  }, [data, total, cx, cy, radius]);

  return (
    <View style={{ width: size, height: size, alignSelf: "center" }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colors.ink100}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {slices.map((s, i) => (
          <Path
            key={i}
            d={s.path}
            stroke={s.d.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="butt"
          />
        ))}
        {centerValue ? (
          <SvgText
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            fontSize={16}
            fontWeight="700"
            fill={colors.ink900}
          >
            {centerValue}
          </SvgText>
        ) : null}
        {centerLabel ? (
          <SvgText
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            fontSize={11}
            fill={colors.ink500}
          >
            {centerLabel}
          </SvgText>
        ) : null}
      </Svg>
    </View>
  );
}

export type LinePoint = { label: string; value: number };

type LineProps = {
  data: LinePoint[];
  width?: number;
  height?: number;
  color?: string;
  fill?: string;
  yLabelFormatter?: (v: number) => string;
};

/**
 * Smooth-ish line chart with area fill, gridlines, and x-axis labels.
 */
export function LineChart({
  data,
  width = 320,
  height = 180,
  color = colors.brand600,
  fill = `${colors.brand600}1A`,
  yLabelFormatter,
}: LineProps) {
  const pad = { top: 16, right: 8, bottom: 24, left: 36 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const max = Math.max(1, ...data.map((d) => d.value));
  const stepY = max / 4;

  const stepX = data.length <= 1 ? 0 : chartW / (data.length - 1);
  const points = data.map((d, i) => {
    const x = pad.left + stepX * i;
    const y = pad.top + chartH - (d.value / max) * chartH;
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = points.length
    ? `M ${points[0].x} ${pad.top + chartH} ` +
      points.map((p) => `L ${p.x} ${p.y}`).join(" ") +
      ` L ${points[points.length - 1].x} ${pad.top + chartH} Z`
    : "";

  return (
    <Svg width={width} height={height}>
      {/* Y gridlines + labels */}
      {[0, 1, 2, 3, 4].map((i) => {
        const v = stepY * (4 - i);
        const y = pad.top + (chartH / 4) * i;
        return (
          <G key={i}>
            <Line
              x1={pad.left}
              y1={y}
              x2={pad.left + chartW}
              y2={y}
              stroke={colors.ink100}
              strokeWidth={1}
            />
            <SvgText
              x={pad.left - 6}
              y={y + 3}
              textAnchor="end"
              fontSize={9}
              fill={colors.ink400}
            >
              {yLabelFormatter ? yLabelFormatter(v) : String(Math.round(v))}
            </SvgText>
          </G>
        );
      })}

      {/* Area fill */}
      {points.length > 1 ? <Path d={areaPath} fill={fill} /> : null}

      {/* Line */}
      {points.length > 1 ? (
        <Polyline
          points={polyline}
          stroke={color}
          strokeWidth={2.5}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}

      {/* Points + x labels */}
      {points.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={3.5} fill={color} />
          <Circle cx={p.x} cy={p.y} r={1.5} fill={colors.white} />
          <SvgText
            x={p.x}
            y={pad.top + chartH + 14}
            textAnchor="middle"
            fontSize={9}
            fill={colors.ink500}
          >
            {p.label}
          </SvgText>
        </G>
      ))}
    </Svg>
  );
}

type BarPoint = { label: string; value: number; color?: string };

/**
 * Vertical bar chart for compare-by-category (e.g., income vs expense).
 */
export function BarChart({
  data,
  width = 320,
  height = 160,
  yLabelFormatter,
}: {
  data: BarPoint[];
  width?: number;
  height?: number;
  yLabelFormatter?: (v: number) => string;
}) {
  const pad = { top: 12, right: 8, bottom: 28, left: 36 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => d.value));

  const slot = chartW / Math.max(1, data.length);
  const barW = Math.min(28, slot * 0.55);

  return (
    <Svg width={width} height={height}>
      {[0, 1, 2].map((i) => {
        const v = (max / 2) * (2 - i);
        const y = pad.top + (chartH / 2) * i;
        return (
          <G key={i}>
            <Line
              x1={pad.left}
              y1={y}
              x2={pad.left + chartW}
              y2={y}
              stroke={colors.ink100}
            />
            <SvgText
              x={pad.left - 6}
              y={y + 3}
              textAnchor="end"
              fontSize={9}
              fill={colors.ink400}
            >
              {yLabelFormatter ? yLabelFormatter(v) : String(Math.round(v))}
            </SvgText>
          </G>
        );
      })}
      {data.map((d, i) => {
        const h = (d.value / max) * chartH;
        const x = pad.left + slot * i + slot / 2 - barW / 2;
        const y = pad.top + chartH - h;
        return (
          <G key={i}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(2, h)}
              rx={5}
              fill={d.color ?? colors.brand600}
            />
            <SvgText
              x={x + barW / 2}
              y={pad.top + chartH + 14}
              textAnchor="middle"
              fontSize={9}
              fill={colors.ink500}
            >
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
