import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // NOTE: These environment variables need to be set in .env.local
    // for the connection to work.
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
