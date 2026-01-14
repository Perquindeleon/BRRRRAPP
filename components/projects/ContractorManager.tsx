"use client";

import { useState } from "react";
import { Plus, Trash, Phone, Mail, Star, Wrench, Globe, Edit, Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addContractor, deleteContractor, updateContractor } from "@/app/dashboard/projects/actions";
import { useRouter } from "next/navigation";
import { SimpleDialog } from "@/components/ui/simple-dialog";
import { Textarea } from "@/components/ui/textarea";
import { StarRatingInput } from "@/components/ui/star-rating-input";

// Wrapper to handle state inside the form
function StarRatingInputComponent({ initialValue, name }: { initialValue: number, name: string }) {
    const [val, setVal] = useState(initialValue);
    return <StarRatingInput value={val} onChange={setVal} name={name} />;
}

interface Contractor {
    id: string;
    name: string;
    specialty: string;
    phone: string;
    email: string;
    website?: string;
    rating: number;
    notes: string;
}

export default function ContractorManager({ contractors }: { contractors: Contractor[] }) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);

    const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

    // AI Email State
    const [isGenerating, setIsGenerating] = useState(false);
    const [emailDraft, setEmailDraft] = useState("");
    const [emailSubject, setEmailSubject] = useState("");

    const handleGenerateEmail = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setEmailSubject(`Project Inquiry: ${selectedContractor?.specialty || 'Work Request'}`);
            setEmailDraft(`Hi ${selectedContractor?.name},\n\nI hope you are doing well.\n\nI have a new project at [Address] that requires your expertise in ${selectedContractor?.specialty || 'construction'}. Are you available to stop by for an estimate this week?\n\nBest,\n[Your Name]`);
            setIsGenerating(false);
        }, 1500);
    };

    const handleSendEmail = () => {
        alert(`Email sent to ${selectedContractor?.email}! 🚀`);
        setIsAiOpen(false);
        setEmailDraft("");
        setEmailSubject("");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Contractors</h2>
                    <p className="text-muted-foreground">Manage your rolodex of trusted professionals.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add Contractor
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {contractors.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        No contractors usually means you're doing all the work! Add someone to help out.
                    </div>
                ) : (
                    contractors.map((c) => (
                        <Card key={c.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div>
                                    <CardTitle className="text-lg font-bold">{c.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-1 mt-1">
                                        <Wrench className="w-3 h-3" /> {c.specialty || "General"}
                                    </CardDescription>
                                </div>
                                <div className="flex bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold items-center gap-1 dark:bg-yellow-900/30 dark:text-yellow-400">
                                    {c.rating} <Star className="w-3 h-3 fill-current" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm text-muted-foreground mt-2">
                                    {c.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {c.phone}</div>}
                                    {c.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {c.email}</div>}
                                    {c.website && (
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-4 h-4" />
                                            <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary">
                                                {c.website}
                                            </a>
                                        </div>
                                    )}
                                    {c.notes && <p className="text-xs italic border-l-2 border-primary/20 pl-2 mt-2">{c.notes}</p>}
                                </div>
                                <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-indigo-600 hover:bg-indigo-50"
                                        onClick={() => {
                                            setSelectedContractor(c);
                                            setIsAiOpen(true);
                                        }}
                                        title="Draft Email"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-500 hover:text-gray-900"
                                        onClick={() => {
                                            setSelectedContractor(c);
                                            setIsEditOpen(true);
                                        }}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <form action={async () => {
                                        if (confirm("Delete this contractor?")) await deleteContractor(c.id);
                                    }}>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <SimpleDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Add New Contractor"
            >
                <form action={async (formData) => {
                    await addContractor(formData);
                    setIsAddOpen(false);
                }} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input name="name" required placeholder="John Doe or Company Name" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Specialty</label>
                        <Select name="specialty" defaultValue="General">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="General">General Contractor</SelectItem>
                                <SelectItem value="Plumber">Plumber</SelectItem>
                                <SelectItem value="Electrician">Electrician</SelectItem>
                                <SelectItem value="HVAC">HVAC</SelectItem>
                                <SelectItem value="Roofer">Roofer</SelectItem>
                                <SelectItem value="Painter">Painter</SelectItem>
                                <SelectItem value="Flooring">Flooring</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone</label>
                            <Input name="phone" placeholder="(555) 555-5555" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input name="email" type="email" placeholder="john@example.com" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Website</label>
                        <Input name="website" placeholder="www.example.com" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Rating (1-5)</label>
                        <StarRatingInputComponent initialValue={5} name="rating" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Notes</label>
                        <Textarea name="notes" placeholder="Private notes about work quality, pricing, etc." className="min-h-[100px]" />
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Contractor</Button>
                    </div>
                </form>
            </SimpleDialog>

            {/* EDIT MODAL */}
            {selectedContractor && (
                <SimpleDialog
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    title="Edit Contractor"
                >
                    <form action={async (formData) => {
                        await updateContractor(formData);
                        setIsEditOpen(false);
                    }} className="space-y-4">
                        <input type="hidden" name="id" value={selectedContractor.id} />
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input name="name" required defaultValue={selectedContractor.name} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Specialty</label>
                            <Select name="specialty" defaultValue={selectedContractor.specialty || "General"}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="General">General Contractor</SelectItem>
                                    <SelectItem value="Plumber">Plumber</SelectItem>
                                    <SelectItem value="Electrician">Electrician</SelectItem>
                                    <SelectItem value="HVAC">HVAC</SelectItem>
                                    <SelectItem value="Roofer">Roofer</SelectItem>
                                    <SelectItem value="Painter">Painter</SelectItem>
                                    <SelectItem value="Flooring">Flooring</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone</label>
                                <Input name="phone" defaultValue={selectedContractor.phone} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input name="email" type="email" defaultValue={selectedContractor.email} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Website</label>
                            <Input name="website" defaultValue={selectedContractor.website} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rating (1-5)</label>
                            <StarRatingInputComponent initialValue={selectedContractor.rating || 0} name="rating" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notes</label>
                            <Textarea name="notes" placeholder="Private notes about work quality, pricing, etc." className="min-h-[100px]" defaultValue={selectedContractor.notes} />
                        </div>
                        <div className="pt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button type="submit">Update Contractor</Button>
                        </div>
                    </form>
                </SimpleDialog>
            )}

            {/* AI COMPOSER MODAL (Adapted from PortfolioView) */}
            <SimpleDialog
                isOpen={isAiOpen}
                onClose={() => setIsAiOpen(false)}
                title={<><Sparkles className="h-5 w-5 text-violet-600" /> AI Email Composer</>}
            >
                <div className="space-y-4">
                    <div className="p-4 bg-violet-50 rounded-lg border border-violet-100 text-sm text-violet-800">
                        Drafting email to <strong>{selectedContractor?.name}</strong> ({selectedContractor?.email || "No Email"})
                    </div>

                    <div className="flex justify-end">
                        <Button
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium shadow-md shadow-violet-200 transition-all hover:scale-[1.02]"
                            onClick={handleGenerateEmail}
                            disabled={isGenerating}
                        >
                            {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Drafting...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Inquiry Draft</>}
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Subject</label>
                        <Input
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder="Subject line..."
                            className="focus-visible:ring-violet-500 hover:border-violet-300 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Message Body</label>
                        <Textarea
                            className="min-h-[150px] resize-none focus-visible:ring-violet-500 hover:border-violet-300 transition-colors"
                            placeholder="Click generate to create an AI draft..."
                            value={emailDraft}
                            onChange={(e) => setEmailDraft(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setIsAiOpen(false)}>Cancel</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSendEmail}>
                            <Send className="h-4 w-4 mr-2" /> Send Now
                        </Button>
                    </div>
                </div>
            </SimpleDialog>
        </div>
    );
}
