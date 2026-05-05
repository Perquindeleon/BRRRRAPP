import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const SpendingIcon = () => (
  <svg viewBox="0 0 200 200" style={{ width: 160, height: 160, opacity: 0.85 }}>
    {/* Shopping bag */}
    <rect x="30" y="70" width="140" height="110" rx="12" fill="rgba(220,60,60,0.8)" />
    <path
      d="M65 70 Q65 30 100 30 Q135 30 135 70"
      stroke="rgba(220,60,60,0.9)"
      strokeWidth="10"
      fill="none"
      strokeLinecap="round"
    />
    <rect x="85" y="105" width="30" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
    {/* Price tag */}
    <circle cx="158" cy="52" r="28" fill="#ff4444" />
    <text x="158" y="58" fill="#fff" fontSize="16" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
      $$$
    </text>
  </svg>
);

const InvestingIcon = () => (
  <svg viewBox="0 0 200 200" style={{ width: 160, height: 160, opacity: 0.9 }}>
    {/* Laptop body */}
    <rect x="20" y="50" width="160" height="100" rx="8" fill="rgba(20,30,20,0.9)" />
    <rect x="28" y="58" width="144" height="84" rx="4" fill="#0d1a0d" />
    {/* Chart on screen */}
    <polyline
      points="36,134 60,120 80,125 100,105 120,95 140,80 162,68"
      stroke="#00e676"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Laptop base */}
    <rect x="5" y="150" width="190" height="10" rx="5" fill="rgba(20,30,20,0.7)" />
    {/* Arrow up */}
    <path
      d="M155 100 L165 82 L175 100"
      stroke="#00e676"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GlitchText = ({
  text,
  frame,
  color,
  size,
  glitchStart,
}: {
  text: string;
  frame: number;
  color: string;
  size: number;
  glitchStart: number;
}) => {
  const relFrame = frame - glitchStart;
  const isGlitching = relFrame >= 0 && relFrame < 20;
  const glitchX = isGlitching ? (relFrame % 4 < 2 ? 7 : relFrame % 3 === 0 ? -5 : 0) : 0;
  const glitchY = isGlitching && relFrame % 6 === 0 ? -4 : 0;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {isGlitching && (
        <>
          <div
            style={{
              position: "absolute",
              top: glitchY - 3,
              left: glitchX + 4,
              fontSize: size,
              fontWeight: 900,
              color: "rgba(255,0,80,0.5)",
              fontFamily: "sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </div>
          <div
            style={{
              position: "absolute",
              top: glitchY + 3,
              left: glitchX - 4,
              fontSize: size,
              fontWeight: 900,
              color: "rgba(0,200,255,0.45)",
              fontFamily: "sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </div>
        </>
      )}
      <div
        style={{
          position: "relative",
          fontSize: size,
          fontWeight: 900,
          color,
          fontFamily: "sans-serif",
          transform: `translate(${glitchX}px, ${glitchY}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Scene2 = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 8, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const leftSlide = interpolate(frame, [5, 35], [-560, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightSlide = interpolate(frame, [5, 35], [560, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const leftSpring = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 18, stiffness: 80 } });
  const iconLeftY = interpolate(leftSpring, [0, 1], [80, 0]);

  const rightSpring = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 18, stiffness: 80 } });
  const iconRightY = interpolate(rightSpring, [0, 1], [80, 0]);

  const dividerOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subTextOpacity = interpolate(frame, [50, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        opacity,
        flexDirection: "row",
        display: "flex",
      }}
    >
      {/* Left side – spending */}
      <div
        style={{
          width: "50%",
          height: "100%",
          background:
            "linear-gradient(180deg, #1a0808 0%, #250d0d 50%, #180808 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateX(${leftSlide}px)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Red ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 400,
            height: 400,
            background:
              "radial-gradient(ellipse, rgba(180,30,30,0.25) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            transform: `translateY(${iconLeftY}px)`,
            marginBottom: 40,
            position: "relative",
          }}
        >
          <SpendingIcon />
        </div>

        <GlitchText
          text="El 90%"
          frame={frame}
          color="#ff4444"
          size={110}
          glitchStart={25}
        />

        <div
          style={{
            opacity: subTextOpacity,
            fontSize: 38,
            fontWeight: 700,
            color: "rgba(255,255,255,0.65)",
            fontFamily: "sans-serif",
            textAlign: "center",
            padding: "0 30px",
            marginTop: 16,
            lineHeight: 1.2,
          }}
        >
          usa las tarjetas
          <br />
          para <span style={{ color: "#ff6666" }}>gastar</span>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: 2,
          height: "100%",
          background:
            "linear-gradient(180deg, transparent, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 80%, transparent)",
          opacity: dividerOpacity,
          zIndex: 10,
        }}
      />

      {/* Right side – investing */}
      <div
        style={{
          width: "50%",
          height: "100%",
          background:
            "linear-gradient(180deg, #071208 0%, #0d1e0d 50%, #071208 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateX(${rightSlide}px)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Green ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 400,
            height: 400,
            background:
              "radial-gradient(ellipse, rgba(0,180,80,0.2) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            transform: `translateY(${iconRightY}px)`,
            marginBottom: 40,
            position: "relative",
          }}
        >
          <InvestingIcon />
        </div>

        <GlitchText
          text="El 1%"
          frame={frame}
          color="#00e676"
          size={110}
          glitchStart={30}
        />

        <div
          style={{
            opacity: subTextOpacity,
            fontSize: 38,
            fontWeight: 700,
            color: "rgba(255,255,255,0.65)",
            fontFamily: "sans-serif",
            textAlign: "center",
            padding: "0 30px",
            marginTop: 16,
            lineHeight: 1.2,
          }}
        >
          las usa para
          <br />
          <span style={{ color: "#00e676" }}>invertir</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
