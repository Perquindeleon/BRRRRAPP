"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = 'en' | 'es';

type Dictionary = {
    [key: string]: string;
};

// Simple dictionary for key UI elements
const dictionaries: Record<Language, Dictionary> = {
    en: {
        "settings.title": "Settings",
        "settings.desc": "Manage your preferences and account settings.",
        "settings.appearance": "Appearance",
        "settings.appearance.desc": "Customize the look and feel of the application.",
        "settings.language": "Language",
        "settings.language.desc": "Select your preferred language.",
        "sidebar.dashboard": "Dashboard",
        "sidebar.find": "Find Deals",
        "sidebar.analyze": "Analyze",
        "sidebar.saved": "Saved Analyses",
        "sidebar.properties": "My Properties",
        "sidebar.projects": "Projects",
        "sidebar.finance": "Finance",
        "sidebar.insights": "AI Insights",
        "sidebar.quick_tools": "Quick Tools",
        "theme.light": "Light",
        "theme.dark": "Dark",
        "theme.system": "System",
    },
    es: {
        "settings.title": "Configuración",
        "settings.desc": "Gestiona tus preferencias y configuración de cuenta.",
        "settings.appearance": "Apariencia",
        "settings.appearance.desc": "Personaliza la apariencia de la aplicación.",
        "settings.language": "Idioma",
        "settings.language.desc": "Selecciona tu idioma preferido.",
        "sidebar.dashboard": "Panel Principal",
        "sidebar.find": "Buscar Ofertas",
        "sidebar.analyze": "Analizar",
        "sidebar.saved": "Análisis Guardados",
        "sidebar.properties": "Mis Propiedades",
        "sidebar.projects": "Proyectos",
        "sidebar.finance": "Finanzas",
        "sidebar.insights": "IA Insights",
        "sidebar.quick_tools": "Herramientas Rápidas",
        "theme.light": "Claro",
        "theme.dark": "Oscuro",
        "theme.system": "Sistema",
    }
};

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('language') as Language;
        if (saved && (saved === 'en' || saved === 'es')) {
            setLanguage(saved);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string) => {
        return dictionaries[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
