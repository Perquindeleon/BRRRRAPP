"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, BrainCircuit, CheckCircle, XCircle, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react";

// --- CONTROLS COMPONENT (For Left Panel) ---

interface AiAdvisorControlsProps {
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
    hasAnalysis: boolean;
    language: "english" | "spanish";
    setLanguage: (lang: "english" | "spanish") => void;
}

export function AiAdvisorControls({
    onGenerate,
    isLoading,
    error,
    hasAnalysis,
    language,
    setLanguage
}: AiAdvisorControlsProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <BrainCircuit className="text-violet-400" />
                        AI Advisor
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                        {language === 'spanish'
                            ? "Obtén un análisis experto instantáneo."
                            : "Get instant expert analysis."}
                    </p>
                </div>

                <div className="bg-slate-800 p-1 rounded-lg flex">
                    <button
                        onClick={() => setLanguage("english")}
                        className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'english' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setLanguage("spanish")}
                        className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'spanish' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Español
                    </button>
                </div>

                <Button
                    onClick={onGenerate}
                    disabled={isLoading}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/20"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {language === 'spanish' ? "Analizando..." : "Analyzing..."}
                        </>
                    ) : (
                        <>
                            {hasAnalysis ? <RefreshCw className="mr-2 h-4 w-4" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                            {hasAnalysis
                                ? (language === 'spanish' ? "Regenerar" : "Regenerate")
                                : (language === 'spanish' ? "Generar Análisis" : "Generate Analysis")}
                        </>
                    )}
                </Button>
            </div>

            {error && (
                <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {hasAnalysis && !error && (
                <div className="text-center text-xs text-muted-foreground p-2 border border-dashed rounded bg-slate-50">
                    {language === 'spanish' ? "Análisis disponible en el panel derecho 👉" : "Analysis available in right panel 👉"}
                </div>
            )}
        </div>
    );
}

// --- RESULTS COMPONENT (For Right Panel) ---

interface AiAdvisorResultsProps {
    analysis: any;
    language: "english" | "spanish";
}

export function AiAdvisorResults({ analysis, language }: AiAdvisorResultsProps) {
    if (!analysis) return null;

    const content = analysis[language];
    if (!content) return null;

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* VERDICT CARD - FULL WIDTH */}
            <Card className="border-none bg-gradient-to-r from-slate-900 to-slate-800 text-white border-l-4 border-l-violet-500 shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <span className="text-violet-400 font-mono text-sm uppercase tracking-wider">Verdict</span>
                    </CardTitle>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                        {content.verdict}
                    </h2>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-300 leading-relaxed text-lg">
                        {content.summary}
                    </p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SWOT ANALYSIS */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">SWOT Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Strengths */}
                        <Card className="bg-emerald-950/30 border-emerald-800/50 shadow-sm">
                            <CardHeader className="pb-2 p-4">
                                <CardTitle className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wide">
                                    <CheckCircle className="h-3 w-3" /> Strengths
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <ul className="list-disc list-inside text-sm text-emerald-100/90 space-y-1">
                                    {content.swot.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Weaknesses */}
                        <Card className="bg-red-950/30 border-red-800/50 shadow-sm">
                            <CardHeader className="pb-2 p-4">
                                <CardTitle className="text-xs font-bold text-red-400 flex items-center gap-2 uppercase tracking-wide">
                                    <XCircle className="h-3 w-3" /> Weaknesses
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <ul className="list-disc list-inside text-sm text-red-100/90 space-y-1">
                                    {content.swot.weaknesses.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Opportunities */}
                        <Card className="bg-blue-950/30 border-blue-800/50 shadow-sm">
                            <CardHeader className="pb-2 p-4">
                                <CardTitle className="text-xs font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wide">
                                    <Lightbulb className="h-3 w-3" /> Opportunities
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <ul className="list-disc list-inside text-sm text-blue-100/90 space-y-1">
                                    {content.swot.opportunities.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Threats */}
                        <Card className="bg-amber-950/30 border-amber-800/50 shadow-sm">
                            <CardHeader className="pb-2 p-4">
                                <CardTitle className="text-xs font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wide">
                                    <AlertTriangle className="h-3 w-3" /> Threats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <ul className="list-disc list-inside text-sm text-amber-100/90 space-y-1">
                                    {content.swot.threats.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* RECOMMENDATIONS */}
                <div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Expert Recommendations</h4>
                    <Card className="bg-slate-900 border-slate-800 h-full shadow-sm">
                        <CardContent className="pt-6">
                            <ul className="space-y-4">
                                {content.recommendations.map((rec: string, i: number) => (
                                    <li key={i} className="flex gap-3 items-start">
                                        <div className="bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold h-6 w-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-sm">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm text-slate-300 font-medium leading-snug">{rec}</p>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
