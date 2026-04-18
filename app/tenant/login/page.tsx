import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { Home, Wrench } from "lucide-react";

export default function TenantLoginPage({
    searchParams,
}: {
    searchParams: { message?: string };
}) {
    const signIn = async (formData: FormData) => {
        "use server";
        const email    = formData.get("email")    as string;
        const password = formData.get("password") as string;
        const supabase = createClient();

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return redirect(`/tenant/login?message=${encodeURIComponent(error.message)}`);
        }
        return redirect("/tenant/portal");
    };

    const signUp = async (formData: FormData) => {
        "use server";
        const origin   = headers().get("origin");
        const email    = formData.get("email")    as string;
        const password = formData.get("password") as string;
        const supabase = createClient();

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${origin}/auth/callback` },
        });

        if (error) {
            return redirect(`/tenant/login?message=${encodeURIComponent(error.message)}`);
        }
        return redirect("/tenant/login?message=Check your email to confirm your account.");
    };

    return (
        <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-4 relative">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-teal-500/8 rounded-full blur-3xl" />
            </div>

            {/* Back to home */}
            <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
                <Home className="h-4 w-4" /> Home
            </Link>

            <div className="relative z-10 w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 mb-4">
                        <Wrench className="h-7 w-7 text-teal-400" />
                    </div>
                    <h1 className="text-2xl font-black text-white">Tenant Portal</h1>
                    <p className="text-white/40 text-sm mt-1">Submit and track your maintenance requests</p>
                </div>

                {/* Form */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <form className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-white/70 text-sm">Email</Label>
                            <Input
                                name="email"
                                type="email"
                                placeholder="your@email.com"
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-teal-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-white/70 text-sm">Password</Label>
                            <Input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-teal-500"
                            />
                        </div>
                        <SubmitButton
                            formAction={signIn}
                            className="w-full h-11 bg-teal-500 hover:bg-teal-400 text-black font-bold"
                        >
                            Sign In
                        </SubmitButton>
                    </form>

                    <div className="relative flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-white/30">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Register — for when landlord hasn't created the account yet */}
                    <form className="space-y-4">
                        <p className="text-xs text-white/40 text-center">First time? Create your account below.</p>
                        <div className="space-y-1.5">
                            <Label className="text-white/70 text-sm">Email</Label>
                            <Input
                                name="email"
                                type="email"
                                placeholder="your@email.com"
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-teal-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-white/70 text-sm">Password</Label>
                            <Input
                                name="password"
                                type="password"
                                placeholder="Choose a password"
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-teal-500"
                            />
                        </div>
                        <SubmitButton
                            formAction={signUp}
                            className="w-full h-11 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                        >
                            Create Tenant Account
                        </SubmitButton>
                    </form>
                </div>

                {searchParams?.message && (
                    <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm text-center">
                        {searchParams.message}
                    </div>
                )}

                <p className="text-center text-xs text-white/30 mt-6">
                    Are you a landlord?{" "}
                    <Link href="/login" className="text-teal-400 hover:underline">Sign in here</Link>
                </p>
            </div>
        </div>
    );
}
