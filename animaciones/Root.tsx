import { Composition } from "remotion";
import { StockChart } from "./StockChart/StockChart";
import { CreditCardVideo } from "./CreditCard/CreditCardVideo";

export const Root = () => {
  return (
    <>
      <Composition
        id="StockChart"
        component={StockChart}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CreditCardVideo"
        component={CreditCardVideo}
        durationInFrames={310}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
