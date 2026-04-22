import { getExpenses } from "./actions";
import { getPortfolioData } from "../properties/actions";
import ExpensesView from "./expenses-view";

export default async function ExpensesPage() {
    const [expenses, portfolioData] = await Promise.all([
        getExpenses(),
        getPortfolioData(),
    ]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Expenses</h2>
                    <p className="text-muted-foreground">Track and report all property expenses.</p>
                </div>
            </div>
            <ExpensesView initialExpenses={expenses} properties={portfolioData} />
        </div>
    );
}
