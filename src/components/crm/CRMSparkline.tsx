import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface CRMSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
  showDots?: boolean;
  trend?: "up" | "down" | "neutral";
}

export function CRMSparkline({
  data,
  color = "hsl(var(--primary))",
  height = 32,
  className,
  showDots = false,
  trend,
}: CRMSparklineProps) {
  const { path, area, dots, width } = useMemo(() => {
    if (data.length < 2) return { path: "", area: "", dots: [], width: 80 };

    const w = 80;
    const h = height;
    const padding = 2;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, i) => ({
      x: padding + (i / (data.length - 1)) * (w - padding * 2),
      y: h - padding - ((value - min) / range) * (h - padding * 2),
    }));

    const pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    const areaD = `${pathD} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

    return { path: pathD, area: areaD, dots: points, width: w };
  }, [data, height]);

  const trendColor = useMemo(() => {
    if (trend === "up") return "hsl(var(--success))";
    if (trend === "down") return "hsl(var(--destructive))";
    return color;
  }, [trend, color]);

  if (data.length < 2) {
    return (
      <div
        className={cn("flex items-center justify-center text-xs text-muted-foreground", className)}
        style={{ height, width }}
      >
        —
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Area fill with gradient */}
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={area}
        fill={`url(#sparkline-gradient-${color})`}
        className="transition-all duration-300"
      />
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={trendColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />
      {/* End dot */}
      {showDots && dots.length > 0 && (
        <circle
          cx={dots[dots.length - 1].x}
          cy={dots[dots.length - 1].y}
          r="2.5"
          fill={trendColor}
          className="transition-all duration-300"
        />
      )}
    </svg>
  );
}
