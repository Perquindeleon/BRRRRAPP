import { AbsoluteFill, Sequence } from "remotion";
import { Scene1 } from "./Scene1";
import { Scene2 } from "./Scene2";
import { Scene3 } from "./Scene3";

export const CreditCardVideo = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Sequence from={0} durationInFrames={100}>
      <Scene1 />
    </Sequence>
    <Sequence from={100} durationInFrames={120}>
      <Scene2 />
    </Sequence>
    <Sequence from={220} durationInFrames={90}>
      <Scene3 />
    </Sequence>
  </AbsoluteFill>
);
