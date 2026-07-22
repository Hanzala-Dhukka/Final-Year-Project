import { useMemo } from "react";
import { Tooltip, ResponsiveContainer, Treemap } from "recharts";
import "./ThreatHeatmap.css";

const SEVERITY_COLORS = {
  Critical: "#ef4444",
  High:     "#f97316",
  Medium:   "#eab308",
  Low:      "#22c55e",
  Info:     "#3b82f6",
};

const DEFAULT_DATA = [
  { name: "Critical", count: 2,  fill: SEVERITY_COLORS.Critical },
  { name: "High",     count: 5,  fill: SEVERITY_COLORS.High },
  { name: "Medium",   count: 9,  fill: SEVERITY_COLORS.Medium },
  { name: "Low",      count: 21, fill: SEVERITY_COLORS.Low },
  { name: "Info",     count: 6,  fill: SEVERITY_COLORS.Info },
];

// Custom cell renderer for the treemap — gives each block its colour + label
function CustomContent({ x, y, width, height, name, count, fill }) {
  if (width < 30 || height < 30) return null;
  return (
    <g>
      <rect
        x={x + 2}
        y={y + 2}
        width={width - 4}
        height={height - 4}
        rx={8}
        ry={8}
        fill={fill}
        fillOpacity={0.85}
        stroke={fill}
        strokeWidth={1}
      />
      {width > 60 && height > 40 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="#fff"
            fontSize={13}
            fontWeight={700}
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="rgba(255,255,255,.8)"
            fontSize={11}
          >
            {count} issue{count !== 1 ? "s" : ""}
          </text>
        </>
      )}
    </g>
  );
}

function TooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, count, fill } = payload[0].payload;
  return (
    <div className="hm-tooltip">
      <span className="hm-tooltip-dot" style={{ background: fill }} />
      <strong>{name}:</strong> {count} issue{count !== 1 ? "s" : ""}
    </div>
  );
}

export default function ThreatHeatmap({ data }) {
  const treemapData = useMemo(() => {
    const src = data && data.length ? data : DEFAULT_DATA;
    return src.map((d) => ({
      name:  d.name,
      count: d.count ?? d.value ?? 0,
      size:  d.count ?? d.value ?? 0,   // recharts Treemap uses `size`
      fill:  d.fill ?? SEVERITY_COLORS[d.name] ?? SEVERITY_COLORS.Info,
    }));
  }, [data]);

  const total = treemapData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="hm-widget widget-card" aria-label="Threat Heatmap">
      <div className="hm-header">
        <div className="hm-title-row">
          <span className="hm-icon" aria-hidden="true">🗺️</span>
          <h3 className="hm-title">Threat Heatmap</h3>
        </div>
        <span className="hm-total">{total} total</span>
      </div>

      {/* Bar heatmap */}
      <div className="hm-bars" aria-label="Threat severity distribution">
        {treemapData.map((d) => {
          const pct = total ? Math.round((d.count / total) * 100) : 0;
          return (
            <div key={d.name} className="hm-bar-row">
              <span
                className="hm-bar-label"
                style={{ color: d.fill }}
              >
                {d.name}
              </span>
              <div
                className="hm-bar-track"
                role="progressbar"
                aria-valuenow={d.count}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label={`${d.name}: ${d.count} issues`}
              >
                <div
                  className="hm-bar-fill"
                  style={{ width: `${pct}%`, background: d.fill }}
                />
              </div>
              <span className="hm-bar-count">{d.count}</span>
            </div>
          );
        })}
      </div>

      {/* Recharts Treemap */}
      <div className="hm-treemap" aria-hidden="true">
        <ResponsiveContainer width="100%" height={180}>
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            content={<CustomContent />}
            isAnimationActive={false}
          >
            <Tooltip content={<TooltipContent />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
