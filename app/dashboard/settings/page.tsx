"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Sun, Laptop, Languages, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    const { t, language, setLanguage } = useLanguage();
    const { theme, setTheme } = useTheme();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center space-x-2 mb-8">
                <Palette className="h-6 w-6 text-indigo-500" />
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                    {t('settings.title')}
                </h1>
            </div>

            <div className="grid gap-6">
                {/* --- APPEARANCE SETTINGS --- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sun className="h-5 w-5 text-orange-500" />
                            {t('settings.appearance')}
                        </CardTitle>
                        <CardDescription>{t('settings.appearance.desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-base">{t('settings.appearance')}</Label>
                                <p className="text-sm text-muted-foreground">Select your preferred color theme</p>
                            </div>
                            <div className="flex bg-muted p-1 rounded-lg">
                                <Button
                                    variant={theme === 'light' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setTheme('light')}
                                    className="h-8"
                                >
                                    <Sun className="h-4 w-4 mr-2" />
                                    {t('theme.light')}
                                </Button>
                                <Button
                                    variant={theme === 'dark' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setTheme('dark')}
                                    className="h-8"
                                >
                                    <Moon className="h-4 w-4 mr-2" />
                                    {t('theme.dark')}
                                </Button>
                                <Button
                                    variant={theme === 'system' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setTheme('system')}
                                    className="h-8"
                                >
                                    <Laptop className="h-4 w-4 mr-2" />
                                    {t('theme.system')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- LANGUAGE SETTINGS --- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Languages className="h-5 w-5 text-blue-500" />
                            {t('settings.language')}
                        </CardTitle>
                        <CardDescription>{t('settings.language.desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-base">{t('settings.language')}</Label>
                                <p className="text-sm text-muted-foreground">Select interface language</p>
                            </div>
                            <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">🇺🇸 English</SelectItem>
                                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
