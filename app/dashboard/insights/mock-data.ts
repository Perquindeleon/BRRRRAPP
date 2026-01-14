
export interface MarketData {
    city: string;
    marketHeatScore: number;
    arvForecast: number;
    rentGrowth: number;
    gentrification: 'Cooling' | 'Stable' | 'Heating' | 'Exploding';
    description: string;
    trends: { month: string; value: number }[];
    topNeighborhoods: string[];
}

export const MOCK_MARKET_DATA: Record<string, MarketData> = {
    "miami": {
        city: "Miami, FL",
        marketHeatScore: 85,
        arvForecast: 4.2,
        rentGrowth: 3.8,
        gentrification: 'Heating',
        description: "High demand in Little Havana and Allapattah. Inventory allows for creative deal structures.",
        trends: [
            { month: 'Jan', value: 380 },
            { month: 'Feb', value: 385 },
            { month: 'Mar', value: 390 },
            { month: 'Apr', value: 392 },
            { month: 'May', value: 400 },
            { month: 'Jun', value: 405 },
        ],
        topNeighborhoods: ["Little Havana", "Allapattah", "Wynwood"]
    },
    "tampa": {
        city: "Tampa, FL",
        marketHeatScore: 92,
        arvForecast: 6.5,
        rentGrowth: 5.1,
        gentrification: 'Exploding',
        description: "Rapid job growth driving housing demand. Ybor City and Seminole Heights are prime targets.",
        trends: [
            { month: 'Jan', value: 290 },
            { month: 'Feb', value: 295 },
            { month: 'Mar', value: 305 },
            { month: 'Apr', value: 310 },
            { month: 'May', value: 320 },
            { month: 'Jun', value: 325 },
        ],
        topNeighborhoods: ["Ybor City", "Seminole Heights", "West Tampa"]
    },
    "orlando": {
        city: "Orlando, FL",
        marketHeatScore: 78,
        arvForecast: 3.5,
        rentGrowth: 4.0,
        gentrification: 'Stable',
        description: "Tourism rebound stabilizing long-term rentals. Good cash flow opportunities in suburbs.",
        trends: [
            { month: 'Jan', value: 310 },
            { month: 'Feb', value: 312 },
            { month: 'Mar', value: 315 },
            { month: 'Apr', value: 318 },
            { month: 'May', value: 320 },
            { month: 'Jun', value: 322 },
        ],
        topNeighborhoods: ["Parramore", "Holden Heights", "Pine Hills"]
    },
    "jacksonville": {
        city: "Jacksonville, FL",
        marketHeatScore: 65,
        arvForecast: 2.1,
        rentGrowth: 1.5,
        gentrification: 'Cooling',
        description: "Inventory surplus currently slowing price growth. Buyers market in some zip codes.",
        trends: [
            { month: 'Jan', value: 250 },
            { month: 'Feb', value: 252 },
            { month: 'Mar', value: 251 },
            { month: 'Apr', value: 253 },
            { month: 'May', value: 250 },
            { month: 'Jun', value: 248 },
        ],
        topNeighborhoods: ["Springfield", "Riverside", "Avondale"]
    }
};

export async function getMarketInsights(cityKey: string): Promise<MarketData> {
    // Simulate API delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(MOCK_MARKET_DATA[cityKey] || MOCK_MARKET_DATA["miami"]);
        }, 800);
    });
}
