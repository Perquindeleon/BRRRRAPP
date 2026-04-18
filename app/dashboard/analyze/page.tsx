"use client";

import { useSearchParams } from "next/navigation";
import { AnalyzerForm } from "./components/analyzer-form";

export default function AnalyzePage() {
    const params = useSearchParams();

    // Pre-fill data coming from Find Deals page
    const address  = params.get("address");
    const price    = params.get("price");
    const arv      = params.get("arv");
    const rent     = params.get("rent");
    const strategy = params.get("strategy"); // "brrrr" | "flip"

    const initialData =
        address || price || arv || rent
            ? {
                  address: address ?? undefined,
                  purchase_price: price ? Number(price) : undefined,
                  arv_estimate: arv ? Number(arv) : undefined,
                  financials: {
                      monthly_rent: rent ? Number(rent) : undefined,
                  },
              }
            : undefined;

    return (
        <AnalyzerForm
            mode="create"
            initialData={initialData}
            initialStrategy={strategy === "flip" ? "flip_fix" : strategy === "brrrr" ? "brrrr" : undefined}
        />
    );
}
