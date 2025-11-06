import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null
let currentUrl: string | null = null

/**
 * Get or create Supabase browser client
 * Uses @supabase/ssr to properly handle cookies for SSR
 * Resets client if URL changes (for development/hot reload scenarios)
 */
export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.'
    )
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`)
  }

  // Reset client if URL changed (for development)
  if (client && currentUrl !== supabaseUrl) {
    client = null
  }

  if (client) return client
  
  currentUrl = supabaseUrl
  
  // Use createBrowserClient from @supabase/ssr with cookie handling
  // Without cookie handlers, it defaults to localStorage which won't work with API routes
  client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Check if we're in browser environment at call time
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          return []
        }
        // Parse cookies from document.cookie
        if (!document.cookie) {
          return []
        }
        return document.cookie.split('; ').map(cookie => {
          const [name, ...rest] = cookie.split('=')
          const trimmedName = name.trim()
          const value = rest.join('=')
          return trimmedName && value ? { name: trimmedName, value: decodeURIComponent(value) } : null
        }).filter((c): c is { name: string; value: string } => c !== null)
      },
      setAll(cookiesToSet) {
        // Check if we're in browser environment at call time
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          return
        }
        cookiesToSet.forEach(({ name, value, options }) => {
          // Build cookie string with proper encoding
          let cookieString = `${name}=${encodeURIComponent(value)}`
          
          // Default options for SSR/API route compatibility
          const cookieOptions = {
            path: '/',
            sameSite: 'lax' as const,
            ...options,
          }
          
          cookieString += `; path=${cookieOptions.path}`
          cookieString += `; samesite=${cookieOptions.sameSite}`
          
          if (cookieOptions.maxAge) cookieString += `; max-age=${cookieOptions.maxAge}`
          if (cookieOptions.domain) cookieString += `; domain=${cookieOptions.domain}`
          if (cookieOptions.secure) cookieString += `; secure`
          
          document.cookie = cookieString
        })
      },
    },
  })
  
  return client
}

/**
 * Reset the browser client (useful for testing or when URL changes)
 */
export function resetSupabaseBrowserClient() {
  client = null
  currentUrl = null
}
