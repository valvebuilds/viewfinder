import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientForAPI } from '@/lib/supabaseServer'
import { STORAGE_BUCKET } from '@/lib/constants'

export async function GET(req: NextRequest) {
  try {
    // Create server client with request cookies
    const { supabase, applyCookies } = getSupabaseServerClientForAPI(req)

    // First try to get session (this refreshes the session if needed)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('API /photos - Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      sessionError: sessionError?.message,
      cookieNames: req.cookies.getAll().map(c => c.name),
      cookieCount: req.cookies.getAll().length
    })

    // If no session, try getUser directly
    if (!session) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      console.log('API /photos - User check (fallback):', {
        hasUser: !!user,
        userId: user?.id,
        error: userError?.message
      })

      if (userError || !user) {
        console.error('API /photos - Auth failed:', {
          sessionError: sessionError?.message,
          userError: userError?.message,
          hasCookies: req.cookies.getAll().length > 0,
          cookieNames: req.cookies.getAll().map(c => c.name)
        })
        return NextResponse.json({ 
          error: 'Unauthorized', 
          details: userError?.message || sessionError?.message || 'No session found'
        }, { status: 401 })
      }

      // Use user from getUser
      // Filter by user_id and ensure path starts with user_id/ to match storage structure
      // Note: user_id must be UUID type in the photos table, not bigint
      console.log('Fetching photos for user:', user.id)
      
      const { data, error } = await supabase
        .from('photos')
        .select('id, path, thumbnail_path, mime, created_at, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase fetch error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        // Check if error is due to type mismatch
        if (error.code === '22P02' && error.message.includes('bigint')) {
          return NextResponse.json({ 
            error: 'Database schema mismatch', 
            details: 'The photos.user_id column must be UUID type, not bigint. Please update your database schema.',
            hint: 'Run: ALTER TABLE photos ALTER COLUMN user_id TYPE uuid USING user_id::uuid;'
          }, { status: 500 })
        }
        return NextResponse.json({ 
          error: error.message,
          code: error.code,
          details: error.details 
        }, { status: 500 })
      }

      // Filter paths that match user_id/ structure (in case there are old records)
      const filteredData = data?.filter(row => row.path?.startsWith(`${user.id}/`)) || []
      
      console.log(`Found ${filteredData.length} photos matching path pattern ${user.id}/`)

      if (!filteredData?.length) {
        return NextResponse.json({ items: [] }, { status: 200 })
      }

      // Generate signed URLs for all photos (expires in 1 year - 31536000 seconds)
      const items = await Promise.all(
        filteredData.map(async (row) => {
          try {
            // Generate signed URL for photo
            const { data: urlData, error: urlError } = await supabase.storage
              .from(STORAGE_BUCKET)
              .createSignedUrl(row.path, 31536000)
            
            const url = urlError || !urlData?.signedUrl ? '' : urlData.signedUrl
            
            // Generate signed URL for thumbnail if it exists
            let thumbnailUrl: string | null = null
            if (row.thumbnail_path) {
              const { data: thumbData, error: thumbError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .createSignedUrl(row.thumbnail_path, 31536000)
              thumbnailUrl = thumbError || !thumbData?.signedUrl ? null : thumbData.signedUrl
            }

            return {
              id: String(row.id),
              url,
              thumbnailUrl,
              name: row.path.split('/').pop() || String(row.id),
              size: 0,
              type: row.mime || 'application/octet-stream',
              createdAt: row.created_at,
            }
          } catch (urlError: any) {
            console.error(`Error generating signed URL for photo ${row.id}:`, urlError)
            // Return a fallback object even if URL generation fails
            return {
              id: String(row.id),
              url: '',
              thumbnailUrl: null,
              name: row.path.split('/').pop() || String(row.id),
              size: 0,
              type: row.mime || 'application/octet-stream',
              createdAt: row.created_at,
            }
          }
        })
      )

      const response = NextResponse.json({ items })
      return applyCookies(response)
    }

    // Always use getUser() to authenticate - never trust session.user directly
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('API /photos - Auth failed after session check:', {
        userError: userError?.message,
        hasSession: !!session
      })
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: userError?.message || 'User authentication failed'
      }, { status: 401 })
    }

    // Filter by user_id and ensure path starts with user_id/ to match storage structure
    // Note: user_id must be UUID type in the photos table, not bigint
    console.log('Fetching photos for user:', user.id)
    
    const { data, error } = await supabase
      .from('photos')
      .select('id, path, thumbnail_path, mime, created_at, user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetch error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      // Check if error is due to type mismatch
      if (error.code === '22P02' && error.message.includes('bigint')) {
        return NextResponse.json({ 
          error: 'Database schema mismatch', 
          details: 'The photos.user_id column must be UUID type, not bigint. Please update your database schema.',
          hint: 'Run: ALTER TABLE photos ALTER COLUMN user_id TYPE uuid USING user_id::uuid;'
        }, { status: 500 })
      }
      return NextResponse.json({ 
        error: error.message,
        code: error.code,
        details: error.details 
      }, { status: 500 })
    }

    // Filter paths that match user_id/ structure (in case there are old records)
    const filteredData = data?.filter(row => row.path?.startsWith(`${user.id}/`)) || []
    
    console.log(`Found ${filteredData.length} photos matching path pattern ${user.id}/`)

    if (!filteredData?.length) {
      return NextResponse.json({ items: [] }, { status: 200 })
    }

    // Generate signed URLs for all photos (expires in 1 year - 31536000 seconds)
    const items = await Promise.all(
      filteredData.map(async (row) => {
        try {
          // Generate signed URL for photo
          const { data: urlData, error: urlError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(row.path, 31536000)
          
          const url = urlError || !urlData?.signedUrl ? '' : urlData.signedUrl
          
          // Generate signed URL for thumbnail if it exists
          let thumbnailUrl: string | null = null
          if (row.thumbnail_path) {
            const { data: thumbData, error: thumbError } = await supabase.storage
              .from(STORAGE_BUCKET)
              .createSignedUrl(row.thumbnail_path, 31536000)
            thumbnailUrl = thumbError || !thumbData?.signedUrl ? null : thumbData.signedUrl
          }

          return {
            id: String(row.id),
            url,
            thumbnailUrl,
            name: row.path.split('/').pop() || String(row.id),
            size: 0,
            type: row.mime || 'application/octet-stream',
            createdAt: row.created_at,
          }
        } catch (urlError: any) {
          console.error(`Error generating signed URL for photo ${row.id}:`, urlError)
          // Return a fallback object even if URL generation fails
          return {
            id: String(row.id),
            url: '',
            thumbnailUrl: null,
            name: row.path.split('/').pop() || String(row.id),
            size: 0,
            type: row.mime || 'application/octet-stream',
            createdAt: row.created_at,
          }
        }
      })
    )

    // Return response with cookies preserved
    const response = NextResponse.json({ items })
    return applyCookies(response)
  } catch (error) {
    console.error('Unexpected error in photos API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}