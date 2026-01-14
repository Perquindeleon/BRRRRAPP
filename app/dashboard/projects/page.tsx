import Link from "next/link";
import { getProjects } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hammer, Plus, ArrowRight } from "lucide-react";

export default async function ProjectsPage() {
    const projects = await getProjects();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Rehab Projects</h2>
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard/properties/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Property
                        </Button>
                    </Link>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] border rounded-lg bg-muted/10 border-dashed">
                    <Hammer className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium">No Active Rehab Projects</h3>
                    <p className="text-muted-foreground mt-2 mb-6">Start by adding a property and marking it as 'owned'.</p>
                    <Link href="/dashboard/analyze">
                        <Button variant="outline">Analyze New Deal</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {project.address}
                                    </CardTitle>
                                    <Hammer className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        ${project.total_actual_rehab?.toLocaleString()}
                                        <span className="text-xs text-muted-foreground font-normal ml-2">
                                            / ${project.total_estimated_rehab?.toLocaleString()} Est.
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {project.item_count} active tasks
                                    </p>
                                    <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
                                        Manage Project <ArrowRight className="ml-1 h-3 w-3" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
