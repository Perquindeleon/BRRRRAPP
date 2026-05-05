import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 131 + 60) % 980 + 50,
  baseY: 1700 - ((i * 97) % 1100),
  size: 2 + (i % 3),
  speed: 0.6 + (i % 4) * 0.25,
  opacity: 0.15 + (i % 5) * 0.06,
}));

const FLOAT_NUMBERS = [
  { x: 80, y: 400, text: "+8.4%", color: "rgba(0,230,120,0.25)", size: 28 },
  { x: 820, y: 300, text: "$12,400", color: "rgba(255,200,50,0.2)", size: 24 },
  { x: 60, y: 700, text: "ROI 100%", color: "rgba(0,230,120,0.2)", size: 22 },
  { x: 750, y: 580, text: "+$1,200", color: "rgba(0,230,120,0.18)", size: 26 },
  { x: 130, y: 950, text: "RENTA", color: "rgba(255,200,50,0.15)", size: 20 },
  { x: 820, y: 850, text: "CAP RATE", color: "rgba(255,200,50,0.15)", size: 20 },
];

const LuxuryHouse = ({ zoom }: { zoom: number }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      transform: `scale(${zoom})`,
      transformOrigin: "center 65%",
    }}
  >
    <svg viewBox="0 0 1080 1920" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="s3sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#04080d" />
          <stop offset="60%" stopColor="#080e18" />
          <stop offset="100%" stopColor="#0a1008" />
        </linearGradient>
        <radialGradient id="moonGlow" cx="75%" cy="12%" r="20%">
          <stop offset="0%" stopColor="rgba(200,220,255,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="1080" height="1920" fill="url(#s3sky)" />
      <rect width="1080" height="1920" fill="url(#moonGlow)" />

      {/* Stars */}
      {[
        [120, 80], [300, 45], [500, 100], [700, 60], [900, 90],
        [200, 180], [450, 150], [650, 200], [850, 140], [980, 70],
        [80, 250], [360, 280], [580, 240], [780, 260], [1020, 200],
      ].map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={1 + (i % 2)} fill={`rgba(255,255,255,${0.2 + (i % 4) * 0.1})`} />
      ))}

      {/* Moon */}
      <circle cx="810" cy="130" r="38" fill="rgba(220,230,255,0.06)" />
      <circle cx="820" cy="125" r="30" fill="rgba(220,230,255,0.04)" />

      {/* Ground */}
      <rect x="0" y="1650" width="1080" height="270" fill="#08100a" />

      {/* Pool with reflection */}
      <rect x="70" y="1644" width="420" height="26" rx="13" fill="rgba(60,120,180,0.45)" />
      <rect x="70" y="1644" width="420" height="6" rx="3" fill="rgba(100,160,220,0.3)" />

      {/* Main house */}
      <rect x="50" y="1050" width="980" height="610" fill="#0f1510" />

      {/* Roof overhang */}
      <rect x="10" y="1005" width="1060" height="58" fill="#0b1008" />

      {/* Large floor-to-ceiling windows – warm amber glow */}
      <rect x="90" y="1100" width="220" height="420" fill="rgba(255,185,65,0.32)" />
      <rect x="340" y="1100" width="140" height="420" fill="rgba(255,185,65,0.2)" />
      <rect x="510" y="1100" width="310" height="420" fill="rgba(255,185,65,0.38)" />
      <rect x="850" y="1100" width="150" height="260" fill="rgba(255,185,65,0.24)" />

      {/* Window mullions */}
      <rect x="303" y="1100" width="7" height="420" fill="#0b1008" />
      <rect x="653" y="1100" width="7" height="420" fill="#0b1008" />

      {/* Upper wing */}
      <rect x="560" y="760" width="470" height="270" fill="#0d1410" />
      <rect x="560" y="728" width="470" height="44" fill="#0a1008" />
      <rect x="620" y="825" width="155" height="165" fill="rgba(255,185,65,0.22)" />
      <rect x="820" y="825" width="175" height="165" fill="rgba(255,185,65,0.28)" />

      {/* Garage door area */}
      <rect x="850" y="1370" width="180" height="140" rx="4" fill="rgba(255,185,65,0.06)" />
      <rect x="850" y="1370" width="180" height="140" rx="4" fill="none" stroke="rgba(255,185,65,0.12)" strokeWidth="2" />
      <line x1="850" y1="1394" x2="1030" y2="1394" stroke="rgba(255,185,65,0.08)" strokeWidth="2" />
      <line x1="850" y1="1418" x2="1030" y2="1418" stroke="rgba(255,185,65,0.08)" strokeWidth="2" />

      {/* Landscaping */}
      <ellipse cx="20" cy="1658" rx="60" ry="95" fill="#0a1208" />
      <ellipse cx="1060" cy="1655" rx="65" ry="105" fill="#0a1208" />
      <ellipse cx="920" cy="1672" rx="42" ry="65" fill="#0a1208" />
      <ellipse cx="490" cy="1672" rx="30" ry="48" fill="#0a1208" />

      {/* Pool reflection glow */}
      <rect x="70" y="1650" width="420" height="80" fill="rgba(255,185,65,0.04)" />
    </svg>
  </div>
);

export const Scene3 = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 10, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Slow camera push in
  const zoomSpring = spring({
    frame,
    fps,
    config: { damping: 60, stiffness: 15, mass: 2 },
  });
  const zoom = interpolate(zoomSpring, [0, 1], [1.0, 1.16]);

  // Text entrance
  const textSpring = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 20, stiffness: 70, mass: 1 },
  });
  const textY = interpolate(textSpring, [0, 1], [70, 0]);
  const textOpacity = interpolate(frame, [20, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA badge spring
  const badgeSpring = spring({
    frame: Math.max(0, frame - 55),
    fps,
    config: { damping: 14, stiffness: 110, mass: 0.85 },
  });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0.4, 1]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity }}>
      {/* Background house with camera push */}
      <LuxuryHouse zoom={zoom} />

      {/* Dark overlay gradient – ensures text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(4,8,13,0.65) 0%, rgba(4,8,13,0.2) 40%, rgba(4,8,13,0.55) 70%, rgba(4,8,13,0.85) 100%)",
        }}
      />

      {/* Floating financial numbers */}
      {FLOAT_NUMBERS.map((n, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: n.y,
            left: n.x,
            fontSize: n.size,
            fontWeight: 700,
            color: n.color,
            fontFamily: "monospace",
            letterSpacing: 1,
            userSelect: "none",
          }}
        >
          {n.text}
        </div>
      ))}

      {/* Floating particles */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      >
        {PARTICLES.map((p, i) => {
          const y = p.baseY - frame * p.speed;
          if (y < -10 || y > 1930) return null;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={y}
              r={p.size}
              fill={`rgba(255,185,65,${p.opacity})`}
            />
          );
        })}
      </svg>

      {/* Main text */}
      <div
        style={{
          position: "absolute",
          bottom: 160,
          left: 0,
          right: 0,
          padding: "0 60px",
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        {/* Golden divider line */}
        <div
          style={{
            width: 80,
            height: 3,
            background: "linear-gradient(90deg, transparent, #f0c030, transparent)",
            margin: "0 auto 28px",
            borderRadius: 2,
          }}
        />

        <div
          style={{
            fontSize: 62,
            fontWeight: 900,
            color: "#ffffff",
            fontFamily: "sans-serif",
            lineHeight: 1.1,
            textAlign: "center",
            textShadow: "0 0 40px rgba(0,0,0,0.9), 0 4px 30px rgba(0,0,0,0.8)",
            letterSpacing: -1,
          }}
        >
          Te enseño la estrategia exacta para que{" "}
          <span
            style={{
              color: "#f0c030",
              textShadow: "0 0 25px rgba(240,192,48,0.5)",
            }}
          >
            el banco pague tu primera propiedad
          </span>
        </div>
      </div>

      {/* CTA badge */}
      <div
        style={{
          position: "absolute",
          bottom: 55,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          transform: `scale(${badgeScale})`,
          transformOrigin: "center bottom",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #c8a020, #f0d050)",
            borderRadius: 50,
            padding: "18px 52px",
            fontSize: 36,
            fontWeight: 900,
            color: "#0a0805",
            fontFamily: "sans-serif",
            letterSpacing: 1.5,
            boxShadow: "0 0 50px rgba(200,155,20,0.5), 0 8px 30px rgba(0,0,0,0.6)",
          }}
        >
          SIGUE PARA APRENDER →
        </div>
      </div>
    </AbsoluteFill>
  );
};
