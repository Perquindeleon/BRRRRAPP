import { getContractors } from "@/app/dashboard/projects/actions";
import ContractorManager from "@/components/projects/ContractorManager";

export default async function ContractorsPage() {
    const contractors = await getContractors() || [];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <ContractorManager contractors={contractors} />
        </div>
    );
}
