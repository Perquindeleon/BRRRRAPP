import Link from "next/link"
import { headers } from "next/headers"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SubmitButton } from "@/components/submit-button"

export default function Login({
    searchParams,
}: {
    searchParams: { message: string; view?: string }
}) {
    const signIn = async (formData: FormData) => {
        "use server"

        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const supabase = createClient()

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return redirect(`/login?message=${encodeURIComponent(error.message)}`)
        }

        return redirect("/dashboard")
    }

    const signUp = async (formData: FormData) => {
        "use server"

        const origin = headers().get("origin")
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const supabase = createClient()

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        })

        if (error) {
            return redirect(`/login?message=${encodeURIComponent(error.message)}&view=register`)
        }

        return redirect("/login?message=Check email to continue sign in process")
    }

    const defaultTab = searchParams.view === "register" ? "register" : "login";

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <Link
                href="/"
                className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-background hover:bg-muted flex items-center group text-sm border"
            >
                <span className="mr-2">←</span> Back
            </Link>

            <div className="w-full max-w-md space-y-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">Welcome to BRRRR Suite</h1>
                    <p className="text-muted-foreground">Manage your real estate empire.</p>
                </div>

                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Sign In</TabsTrigger>
                        <TabsTrigger value="register">New Account</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sign In</CardTitle>
                                <CardDescription>
                                    Enter your credentials to access your dashboard.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <form className="flex flex-col gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" placeholder="name@example.com" type="email" required />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" name="password" type="password" required />
                                    </div>
                                    <SubmitButton formAction={signIn} className="w-full bg-emerald-600 hover:bg-emerald-700">Sign In</SubmitButton>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="register">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create Account</CardTitle>
                                <CardDescription>
                                    Start your journey with a new account.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <form className="flex flex-col gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="sign-up-email">Email</Label>
                                        <Input id="sign-up-email" name="email" placeholder="name@example.com" type="email" required />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="sign-up-password">Password</Label>
                                        <Input id="sign-up-password" name="password" type="password" required />
                                    </div>
                                    <SubmitButton formAction={signUp} className="w-full">Create Account</SubmitButton>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {searchParams?.message && (
                    <div className="p-4 rounded-md bg-destructive/15 text-destructive text-sm text-center font-medium border border-destructive/20">
                        {searchParams.message}
                    </div>
                )}
            </div>
        </div>
    )
}
