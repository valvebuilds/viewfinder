import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getSupabaseBrowserClient } from '../supabaseBrowser'

// Mock environment variables
vi.mock('../supabaseBrowser', async () => {
  const actual = await vi.importActual('../supabaseBrowser')
  return {
    ...actual,
  }
})

describe('getSupabaseBrowserClient', () => {
  beforeEach(() => {
    // Set mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('should return a Supabase client instance', () => {
    const client = getSupabaseBrowserClient()
    expect(client).toBeDefined()
    expect(client).toHaveProperty('auth')
    expect(client).toHaveProperty('storage')
    expect(client).toHaveProperty('from')
  })

  it('should return the same singleton instance on multiple calls', () => {
    const client1 = getSupabaseBrowserClient()
    const client2 = getSupabaseBrowserClient()
    expect(client1).toBe(client2)
  })
})

