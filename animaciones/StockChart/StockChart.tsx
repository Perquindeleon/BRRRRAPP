import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const PRICE_DATA = [
  100, 98, 103, 101, 107, 105, 110, 108, 115, 112,
  118, 116, 122, 120, 128, 125, 132, 130, 138, 135,
  142, 140, 148, 145, 152, 150, 158, 155, 162, 160,
  168, 165, 172, 170, 178, 175, 182, 180, 188, 185,
  192, 190, 196, 194, 198, 197, 199, 200,
];

const PADDING = { top: 80, right: 120, bottom: 100, left: 100 };

function buildPath(
  points: { x: number; y: number }[],
  progress: number
): string {
  const visible = Math.max(2, Math.floor(points.length * progress));
  const pts = points.slice(0, visible);
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
}

export const StockChart = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps, width, height } = useVideoConfig();

  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const minPrice = 94;
  const maxPrice = 205;

  const points = PRICE_DATA.map((price, i) => ({
    x: PADDING.left + (i / (PRICE_DATA.length - 1)) * chartW,
    y:
      PADDING.top +
      chartH -
      ((price - minPrice) / (maxPrice - minPrice)) * chartH,
  }));

  // Line draws over first 70% of the video
  const lineProgress = interpolate(frame, [0, durationInFrames * 0.7], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Camera zoom starts at 60% of the video
  const zoomProgress = spring({
    frame: Math.max(0, frame - durationInFrames * 0.6),
    fps,
    config: { damping: 18, stiffness: 60, mass: 1.2 },
  });

  const scale = interpolate(zoomProgress, [0, 1], [1, 1.18]);
  const translateX = interpolate(zoomProgress, [0, 1], [0, -width * 0.06]);
  const translateY = interpolate(zoomProgress, [0, 1], [0, height * 0.04]);

  // Glowing dot follows the line tip
  const visibleIdx = Math.max(1, Math.floor((PRICE_DATA.length - 1) * lineProgress));
  const dotX = points[Math.min(visibleIdx, points.length - 1)].x;
  const dotY = points[Math.min(visibleIdx, points.length - 1)].y;

  // Labels fade in after line is complete
  const labelOpacity = interpolate(frame, [durationInFrames * 0.72, durationInFrames * 0.85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // +100% badge springs in
  const badgeScale = spring({
    frame: Math.max(0, frame - durationInFrames * 0.75),
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  const path = buildPath(points, lineProgress);

  // Y-axis grid lines
  const gridLines = [0, 25, 50, 75, 100].map((pct) => {
    const price = minPrice + ((maxPrice - minPrice) * pct) / 100;
    const y = PADDING.top + chartH - (pct / 100) * chartH;
    return { y, price: Math.round(price) };
  });

  return (
    <AbsoluteFill style={{ background: "#0a0e1a", overflow: "hidden" }}>
      {/* Camera animation */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transformOrigin: "70% 40%",
        }}
      >
        <svg width={width} height={height}>
          <defs>
            {/* Line gradient */}
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00c896" />
              <stop offset="100%" stopColor="#00ff88" />
            </linearGradient>

            {/* Area fill gradient */}
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00ff88" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Dot glow */}
            <filter id="dotGlow">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <clipPath id="chartClip">
              <rect x={PADDING.left} y={PADDING.top} width={chartW} height={chartH} />
            </clipPath>
          </defs>

          {/* Grid lines */}
          {gridLines.map(({ y, price }) => (
            <g key={price}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={PADDING.left + chartW}
                y2={y}
                stroke="#1e2840"
                strokeWidth={1}
                strokeDasharray="6 6"
              />
              <text
                x={PADDING.left - 14}
                y={y + 5}
                fill="#4a5578"
                fontSize={22}
                textAnchor="end"
                fontFamily="monospace"
              >
                ${price}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line
            x1={PADDING.left}
            y1={PADDING.top}
            x2={PADDING.left}
            y2={PADDING.top + chartH}
            stroke="#1e2840"
            strokeWidth={2}
          />
          <line
            x1={PADDING.left}
            y1={PADDING.top + chartH}
            x2={PADDING.left + chartW}
            y2={PADDING.top + chartH}
            stroke="#1e2840"
            strokeWidth={2}
          />

          {/* Area fill under line */}
          <clipPath id="areaClip">
            <rect
              x={PADDING.left}
              y={PADDING.top}
              width={chartW * lineProgress}
              height={chartH}
            />
          </clipPath>
          <path
            d={`${path} L ${dotX} ${PADDING.top + chartH} L ${PADDING.left} ${PADDING.top + chartH} Z`}
            fill="url(#areaGrad)"
            clipPath="url(#areaClip)"
          />

          {/* Main line */}
          <path
            d={path}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            clipPath="url(#chartClip)"
          />

          {/* Glowing dot at tip */}
          <circle
            cx={dotX}
            cy={dotY}
            r={14}
            fill="#00ff88"
            opacity={0.15}
            filter="url(#dotGlow)"
          />
          <circle
            cx={dotX}
            cy={dotY}
            r={7}
            fill="#00ff88"
            filter="url(#dotGlow)"
          />
          <circle cx={dotX} cy={dotY} r={4} fill="#ffffff" />

          {/* Start label */}
          <g opacity={labelOpacity}>
            <circle cx={points[0].x} cy={points[0].y} r={6} fill="#4a5578" />
            <text
              x={points[0].x}
              y={points[0].y - 20}
              fill="#4a5578"
              fontSize={24}
              textAnchor="middle"
              fontFamily="monospace"
            >
              $100
            </text>
          </g>

          {/* End label */}
          <g opacity={labelOpacity}>
            <text
              x={points[points.length - 1].x + 16}
              y={points[points.length - 1].y + 8}
              fill="#00ff88"
              fontSize={26}
              fontWeight="bold"
              fontFamily="monospace"
            >
              $200
            </text>
          </g>

          {/* Title */}
          <text
            x={width / 2}
            y={46}
            fill="#e2e8f0"
            fontSize={36}
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="sans-serif"
            letterSpacing={2}
          >
            BRRRR · Simulación de Rendimiento
          </text>
        </svg>

        {/* +100% badge */}
        <div
          style={{
            position: "absolute",
            top: height * 0.18,
            right: PADDING.right + 20,
            transform: `scale(${badgeScale})`,
            transformOrigin: "center center",
            background: "linear-gradient(135deg, #00c896, #00ff88)",
            borderRadius: 20,
            padding: "16px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 0 40px rgba(0,255,136,0.4)",
          }}
        >
          <span
            style={{
              color: "#0a0e1a",
              fontSize: 52,
              fontWeight: 900,
              fontFamily: "sans-serif",
              lineHeight: 1,
            }}
          >
            +100%
          </span>
          <span
            style={{
              color: "#0a0e1a",
              fontSize: 20,
              fontWeight: 600,
              fontFamily: "sans-serif",
              opacity: 0.7,
              marginTop: 4,
            }}
          >
            rendimiento total
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
