"use client";

import { useState } from "react";
import { FileText, Upload, Trash, Download, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleDialog } from "@/components/ui/simple-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadDocument, deleteDocument } from "@/app/dashboard/projects/actions";
import { Badge } from "@/components/ui/badge";

interface Document {
    id: string;
    name: string;
    type: string;
    url: string;
    created_at: string;
}

export default function DocumentManager({ propertyId, documents }: { propertyId: string, documents: Document[] }) {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (formData: FormData) => {
        setIsUploading(true);
        const res = await uploadDocument(formData);
        setIsUploading(false);
        if (res?.error) {
            alert(res.error);
        } else {
            setIsUploadOpen(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Project Documents</h3>
                <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
                    <Upload className="w-4 h-4" /> Upload New
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        No documents yet. Upload contracts, permits, or inspections here.
                    </div>
                ) : (
                    documents.map((doc) => (
                        <Card key={doc.id} className="hover:shadow-md transition-all group">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate" title={doc.name}>{doc.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-[10px] capitalize">{doc.type}</Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </a>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={async () => {
                                                if (confirm("Delete this document?")) await deleteDocument(doc.id, propertyId);
                                            }}
                                        >
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <SimpleDialog
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                title="Upload Document"
            >
                <form action={handleUpload} className="space-y-4">
                    <input type="hidden" name="property_id" value={propertyId} />

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Document Type</label>
                        <Select name="type" defaultValue="other">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="contract">Contractor Agreement</SelectItem>
                                <SelectItem value="permit">Permit / License</SelectItem>
                                <SelectItem value="inspection">Inspection Report</SelectItem>
                                <SelectItem value="receipt">Receipt / Invoice</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select File</label>
                        <Input name="file" type="file" required className="cursor-pointer" />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isUploading}>
                            {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : 'Upload'}
                        </Button>
                    </div>
                </form>
            </SimpleDialog>
        </div>
    );
}
