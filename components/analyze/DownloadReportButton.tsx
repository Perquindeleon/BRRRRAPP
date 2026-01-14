"use client";

import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function DownloadReportButton({ elementId, fileName = "report" }: { elementId: string, fileName?: string }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const input = document.getElementById(elementId);
            if (!input) {
                console.error("Element not found");
                return;
            }

            // Optional: temporarily force white background/padding if needed
            // const originalBg = input.style.backgroundColor;
            // input.style.backgroundColor = '#ffffff';

            const canvas = await html2canvas(input, {
                scale: 2, // Higher resolution
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // input.style.backgroundColor = originalBg;

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${fileName}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isGenerating}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
        >
            {isGenerating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
            ) : (
                <><FileDown className="mr-2 h-4 w-4" /> Download Report</>
            )}
        </Button>
    );
}
