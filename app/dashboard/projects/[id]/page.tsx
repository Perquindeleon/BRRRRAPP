import { getProperty, getRehabItems, getTenants, getMilestones, updateProjectDriveUrl, getContractors, getDocuments } from "../actions";
import { AddItemForm } from "./add-item-form";
import { AiEstimator } from "../ai-estimator";
import { RehabItemRow } from "../components/rehab-item-row";
import { TenantManager } from "../components/tenant-manager";
import DocumentManager from "@/components/projects/document-manager";
import KanbanBoard from "@/components/projects/kanban-board";
import TimelineGantt from "@/components/projects/TimelineGantt";
import { BudgetOverview } from "../components/budget-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Circle, Clock, Hammer, Building, Calendar, Image as ImageIcon, ExternalLink, Save, FileText } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DownloadReportButton } from "@/components/analyze/DownloadReportButton";

// ... imports remain the same

export default async function ProjectDetailsPage({
    params,
}: {
    params: { id: string };
}) {
    // ... data fetching remains the same
    const property = await getProperty(params.id);
    const items = await getRehabItems(params.id) || [];
    const contractors = await getContractors() || [];
    let tenants = [];
    try {
        tenants = await getTenants(params.id) || [];
    } catch (e) { console.log('Tenant table missing?'); }

    const milestones = await getMilestones(params.id) || [];
    const documents = await getDocuments(params.id) || [];


    if (!property) return <div>Project not found</div>;

    const totalEstimated = items.reduce((sum: number, item: any) => sum + (item.estimated_cost || 0), 0);
    const totalActual = items.reduce((sum: number, item: any) => sum + (item.actual_cost || 0), 0);
    const completedCount = items.filter(i => i.status === 'completed').length;
    const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

    return (
        <div className="flex-1 space-y-6 p-4 lg:p-8 pt-6">
            {/* Header */}
            <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Link href="/dashboard/properties" className="hover:text-foreground flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Portfolio
                    </Link>
                    <span>/</span>
                    <span>{property.address}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Dashboard</h2>
                        <Badge className="capitalize">{property.status}</Badge>
                    </div>
                    {/* PDF Download Button */}
                    <DownloadReportButton elementId="project-report" fileName={`${property.address}-Report`} />
                </div>
            </div>

            {/* ERROR FIX: Wrapped content in ID for PDF generation */}
            <div id="project-report" className="space-y-6 bg-card p-2 rounded-xl">
                <Tabs defaultValue="rehab" className="space-y-4">
                    <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50 p-1 mb-2">
                        <TabsTrigger value="rehab" className="flex items-center gap-2">
                            <Hammer className="h-4 w-4" /> Rehab & CapEx
                        </TabsTrigger>
                        <TabsTrigger value="tenants" className="flex items-center gap-2">
                            <Building className="h-4 w-4" /> Tenants & Leases
                        </TabsTrigger>
                        <TabsTrigger value="timeline" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Timeline
                        </TabsTrigger>
                        <TabsTrigger value="photos" className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" /> Photos
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Documents
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="rehab" className="space-y-6">
                        {/* Stats Overview */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Estimated Budget</CardTitle>
                                    <span className="text-muted-foreground">$</span>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{progress}%</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Actual Spend</CardTitle>
                                    <span className="text-muted-foreground">$</span>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">${totalActual.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                                    <Hammer className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{items.length}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Progress</CardTitle>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{progress}%</div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                            {/* Side Panel: AI + Manual Form */}
                            <div className="col-span-3 space-y-6">
                                <BudgetOverview rehabItems={items} />
                                <AiEstimator propertyId={property.id} />
                                <AddItemForm propertyId={property.id} />
                            </div>

                            {/* Task List / Board */}
                            <div className="col-span-4">
                                <Tabs defaultValue="list" className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <CardTitle className="text-lg">Tasks</CardTitle>
                                        <TabsList className="grid w-[180px] grid-cols-2">
                                            <TabsTrigger value="list">List</TabsTrigger>
                                            <TabsTrigger value="board">Board</TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <TabsContent value="list">
                                        <Card className="h-full">
                                            <CardContent className="p-0">
                                                {items.length === 0 ? (
                                                    <div className="text-center py-10 text-muted-foreground">
                                                        No tasks added yet. Add one to get started.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-0">
                                                        {items.map((item: any) => (
                                                            <RehabItemRow key={item.id} item={item} contractors={contractors} />
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="board">
                                        <KanbanBoard items={items} propertyId={property.id} />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="tenants" className="space-y-6">
                        <TenantManager propertyId={property.id} tenants={tenants} />
                    </TabsContent>

                    <TabsContent value="timeline" className="space-y-6">
                        <TimelineGantt milestones={milestones} propertyId={property.id} />
                    </TabsContent>

                    <TabsContent value="photos" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-violet-600" /> Project Photos (Google Drive)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="bg-muted/30 p-6 rounded-lg border border-dashed text-center space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        We integrate directly with Google Drive to keep your photos organized and secure.
                                        Paste your folder link below.
                                    </p>

                                    {/* Drive URL Form */}
                                    <form action={async (formData) => {
                                        "use server";
                                        const url = formData.get("drive_url") as string;
                                        await updateProjectDriveUrl(property.id, url);
                                    }} className="max-w-md mx-auto flex gap-2">
                                        <input
                                            name="drive_url"
                                            defaultValue={property.drive_folder_url || ""}
                                            placeholder="https://drive.google.com/drive/folders/..."
                                            className="flex-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        />
                                        <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md flex items-center gap-2">
                                            <Save className="w-4 h-4" /> Save
                                        </button>
                                    </form>

                                    {/* Open Drive Button */}
                                    {property.drive_folder_url && (
                                        <div className="pt-4">
                                            <a
                                                href={property.drive_folder_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 h-11 px-8 py-2"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" /> Open Folder in Google Drive
                                            </a>
                                            <p className="text-xs text-muted-foreground mt-2">Opens in a new tab</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-6">
                        <DocumentManager propertyId={property.id} documents={documents} />
                    </TabsContent>
                </Tabs>
            </div>

        </div>
    );
}


function StatusIcon({ status }: { status: string }) {
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    if (status === 'in_progress') return <Clock className="h-4 w-4 text-blue-500" />
    return <Circle className="h-4 w-4 text-muted-foreground" />
}
