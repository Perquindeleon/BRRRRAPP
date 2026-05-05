import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const HouseBackground = ({ scale }: { scale: number }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      transform: `scale(${scale})`,
      transformOrigin: "center bottom",
      filter: "blur(10px) brightness(0.35)",
    }}
  >
    <svg viewBox="0 0 1080 1920" style={{ width: "100%", height: "100%" }}>
      {/* Sky */}
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0a0805" />
          <stop offset="100%" stopColor="#1c1408" />
        </linearGradient>
        <radialGradient id="windowGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,190,80,0.8)" />
          <stop offset="100%" stopColor="rgba(255,190,80,0)" />
        </radialGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#skyGrad)" />

      {/* Ground */}
      <rect x="0" y="1650" width="1080" height="270" fill="#0d0b06" />

      {/* Pool */}
      <rect x="80" y="1648" width="350" height="18" rx="9" fill="rgba(80,140,200,0.35)" />

      {/* Main house body */}
      <rect x="60" y="1080" width="960" height="580" fill="#1a1510" />

      {/* Flat roof overhang */}
      <rect x="20" y="1040" width="1040" height="55" fill="#111009" />

      {/* Large windows – warm glow */}
      <rect x="100" y="1150" width="200" height="350" fill="rgba(255,185,70,0.28)" />
      <rect x="330" y="1150" width="130" height="350" fill="rgba(255,185,70,0.18)" />
      <rect x="490" y="1150" width="290" height="350" fill="rgba(255,185,70,0.34)" />
      <rect x="810" y="1150" width="170" height="220" fill="rgba(255,185,70,0.22)" />

      {/* Dividers between window panes */}
      <rect x="194" y="1150" width="6" height="350" fill="#141008" />
      <rect x="617" y="1150" width="6" height="350" fill="#141008" />

      {/* Second floor wing */}
      <rect x="560" y="820" width="440" height="250" fill="#161209" />
      <rect x="615" y="885" width="140" height="140" fill="rgba(255,185,70,0.2)" />
      <rect x="790" y="885" width="170" height="140" fill="rgba(255,185,70,0.26)" />
      <rect x="560" y="795" width="440" height="38" fill="#101008" />

      {/* Trees / landscaping */}
      <ellipse cx="30" cy="1655" rx="55" ry="90" fill="#0d1005" />
      <ellipse cx="1050" cy="1650" rx="60" ry="100" fill="#0d1005" />
      <ellipse cx="900" cy="1668" rx="38" ry="60" fill="#0d1005" />
      <ellipse cx="460" cy="1668" rx="28" ry="45" fill="#0d1005" />
    </svg>
  </div>
);

const CreditCard = ({ shineX }: { shineX: number }) => (
  <svg
    viewBox="0 0 600 380"
    style={{
      width: 540,
      height: 342,
      filter:
        "drop-shadow(0 40px 80px rgba(0,0,0,0.9)) drop-shadow(0 0 60px rgba(200,155,20,0.35))",
    }}
  >
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1c1005" />
        <stop offset="22%" stopColor="#a87a18" />
        <stop offset="42%" stopColor="#f0cc55" />
        <stop offset="58%" stopColor="#c49020" />
        <stop offset="78%" stopColor="#8a5e10" />
        <stop offset="100%" stopColor="#1c1005" />
      </linearGradient>
      <linearGradient id="shineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
        <stop offset="45%" stopColor="rgba(255,255,255,0.55)" />
        <stop offset="55%" stopColor="rgba(255,255,255,0.55)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
      <clipPath id="cardClip">
        <rect width="600" height="380" rx="30" />
      </clipPath>
    </defs>

    {/* Card base */}
    <rect width="600" height="380" rx="30" fill="url(#goldGrad)" />

    {/* Metal texture diagonal stripes */}
    <g clipPath="url(#cardClip)" opacity="0.07">
      <line x1="-100" y1="450" x2="700" y2="-50" stroke="#fff" strokeWidth="50" />
      <line x1="-100" y1="600" x2="700" y2="100" stroke="#fff" strokeWidth="30" />
      <line x1="-100" y1="280" x2="700" y2="-220" stroke="#fff" strokeWidth="20" />
    </g>

    {/* Card border */}
    <rect
      width="600"
      height="380"
      rx="30"
      fill="none"
      stroke="rgba(255,215,80,0.35)"
      strokeWidth="1.5"
    />

    {/* EMV Chip */}
    <rect x="50" y="142" width="84" height="64" rx="11" fill="#b08818" />
    <rect x="58" y="150" width="68" height="48" rx="7" fill="#c8a025" />
    <line x1="92" y1="150" x2="92" y2="198" stroke="#a07815" strokeWidth="2" />
    <line x1="58" y1="174" x2="126" y2="174" stroke="#a07815" strokeWidth="2" />

    {/* Contactless waves */}
    <path
      d="M172 162 Q190 174 172 186"
      stroke="rgba(255,215,80,0.75)"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M184 154 Q210 174 184 194"
      stroke="rgba(255,215,80,0.6)"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M196 147 Q230 174 196 201"
      stroke="rgba(255,215,80,0.45)"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />

    {/* Card number */}
    <text
      x="50"
      y="290"
      fill="rgba(255,238,170,0.92)"
      fontSize="34"
      fontFamily="monospace"
      letterSpacing="7"
      fontWeight="600"
    >
      •••• •••• •••• 4892
    </text>

    {/* Valid thru label */}
    <text
      x="52"
      y="328"
      fill="rgba(255,225,140,0.5)"
      fontSize="14"
      fontFamily="sans-serif"
      letterSpacing="1.5"
    >
      VÁLIDO HASTA
    </text>
    <text
      x="52"
      y="352"
      fill="rgba(255,228,150,0.8)"
      fontSize="22"
      fontFamily="monospace"
      fontWeight="700"
      letterSpacing="2"
    >
      12/29
    </text>

    {/* Name */}
    <text
      x="215"
      y="352"
      fill="rgba(255,228,150,0.85)"
      fontSize="22"
      fontFamily="sans-serif"
      letterSpacing="3"
      fontWeight="700"
    >
      HERNÁNDEZ
    </text>

    {/* Visa logo */}
    <text
      x="548"
      y="358"
      fill="rgba(255,238,170,0.92)"
      fontSize="34"
      fontFamily="serif"
      fontStyle="italic"
      fontWeight="900"
      textAnchor="middle"
    >
      VISA
    </text>

    {/* Overlapping circles emblem top-right */}
    <circle cx="520" cy="72" r="44" fill="rgba(200,140,20,0.25)" />
    <circle cx="556" cy="72" r="44" fill="rgba(255,180,20,0.2)" />

    {/* Shine sweep */}
    <rect
      x={shineX}
      y="0"
      width="160"
      height="380"
      fill="url(#shineGrad)"
      clipPath="url(#cardClip)"
    />
  </svg>
);

export const Scene1 = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const cardSpring = spring({ frame, fps, config: { damping: 22, stiffness: 65, mass: 1.1 } });
  const cardScale = interpolate(cardSpring, [0, 1], [0.55, 1]);
  const cardRotate = interpolate(frame, [0, 25], [10, 0], { extrapolateRight: "clamp" });

  const shineX = interpolate(frame, [12, 65], [-200, 760], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bgScale = interpolate(frame, [0, durationInFrames], [1.12, 1.0], {
    extrapolateRight: "clamp",
  });

  const textOpacity = interpolate(frame, [50, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [50, 85], [55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade in / out
  const opacity = interpolate(
    frame,
    [0, 8, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #080604 0%, #1a1308 50%, #0d0a04 100%)",
        overflow: "hidden",
        opacity,
      }}
    >
      <HouseBackground scale={bgScale} />

      {/* Ambient warm glow */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 700,
          background:
            "radial-gradient(ellipse, rgba(200,130,20,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Top glow behind card */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700,
          height: 500,
          background:
            "radial-gradient(ellipse, rgba(200,155,20,0.12) 0%, transparent 65%)",
        }}
      />

      {/* Credit card */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          top: "28%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${cardScale}) rotate(${cardRotate}deg)`,
          transformOrigin: "center center",
        }}
      >
        <CreditCard shineX={shineX} />
      </div>

      {/* Text */}
      <div
        style={{
          position: "absolute",
          bottom: 130,
          left: 0,
          right: 0,
          padding: "0 55px",
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        {/* Pill label */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              background: "rgba(200,155,20,0.2)",
              border: "1px solid rgba(200,155,20,0.45)",
              borderRadius: 40,
              padding: "8px 28px",
              fontSize: 28,
              color: "#f0c040",
              fontFamily: "sans-serif",
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            EDUCACIÓN FINANCIERA
          </div>
        </div>

        <div
          style={{
            fontSize: 74,
            fontWeight: 900,
            color: "#ffffff",
            fontFamily: "sans-serif",
            lineHeight: 1.08,
            textAlign: "center",
            textShadow:
              "0 0 50px rgba(200,155,20,0.45), 0 4px 24px rgba(0,0,0,0.9)",
            letterSpacing: -1.5,
          }}
        >
          Tu tarjeta de crédito es una cuenta bancaria{" "}
          <span
            style={{
              color: "#f0c030",
              textShadow: "0 0 30px rgba(240,192,48,0.6)",
            }}
          >
            gratis
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
