import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientForAPI } from '@/lib/supabaseServer'
import { STORAGE_BUCKET } from '@/lib/constants'

export async function GET(req: NextRequest) {
  try {
    // Create server client with request cookies
    const { supabase, applyCookies } = getSupabaseServerClientForAPI(req)

    const { searchParams } = req.nextUrl
    const limit = Number(searchParams.get('limit') || '20') // Default limit to 20
    const offset = Number(searchParams.get('offset') || '0') // Default offset to 0

    // Always try to get user directly for authentication
    const { data: authData, error: userError } = await supabase.auth.getUser()
    const user = authData?.user

    console.log('API /photos - User check:', {
      hasUser: !!user,
      userId: user?.id,
      error: userError?.message,
      cookieNames: req.cookies.getAll().map(c => c.name),
      cookieCount: req.cookies.getAll().length
    })

    if (userError || !user) {
      console.error('API /photos - Auth failed:', {
        userError: userError?.message,
        hasCookies: req.cookies.getAll().length > 0,
        cookieNames: req.cookies.getAll().map(c => c.name)
      })
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: userError?.message || 'User authentication failed'
      }, { status: 401 })
    }

    console.log('Fetching photos for user:', user.id)
    
    const { data: photosData, error, count } = await supabase
      .from('photos')
      .select('id, path, thumbnail_path, mime, created_at, user_id, data', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase fetch error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
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

    const filteredData = photosData || []
    
    console.log(`Found ${filteredData.length} photos for user ${user.id} (offset: ${offset}, limit: ${limit})`)

    // Process photos to get signed URLs if needed and format for client
    const items = await Promise.all(
      filteredData.map(async (row) => {
        // Determine the full URL
        let fullImageUrl = row.path || '';
        if (fullImageUrl && !(fullImageUrl.startsWith('http://') || fullImageUrl.startsWith('https://'))) {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(row.path, 31536000) // 1 year expiration
          if (signedUrlError) {
            console.error(`Error generating signed URL for full image ${row.id}:`, signedUrlError)
            fullImageUrl = ''; // Fallback to empty string on error
          } else {
            fullImageUrl = signedUrlData?.signedUrl || '';
          }
        }

        // Determine the thumbnail URL
        let thumbnailImageUrl = row.thumbnail_path || null;
        if (thumbnailImageUrl && !(thumbnailImageUrl.startsWith('http://') || thumbnailImageUrl.startsWith('https://'))) {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(row.thumbnail_path, 31536000) // 1 year expiration
          if (signedUrlError) {
            console.error(`Error generating signed URL for thumbnail ${row.id}:`, signedUrlError)
            thumbnailImageUrl = null; // Fallback to null on error
          } else {
            thumbnailImageUrl = signedUrlData?.signedUrl || null;
          }
        }

        return {
          id: String(row.id),
          url: fullImageUrl,
          thumbnailUrl: thumbnailImageUrl,
          name: row.path.split('/').pop() || String(row.id),
          size: 0,
          type: row.mime || 'application/octet-stream',
          createdAt: row.created_at,
          data: row.data || null, // Include JSON data column
        }
      })
    )

    // Return response with cookies preserved
    const response = NextResponse.json({ items, totalCount: count || 0 })
    return applyCookies(response)
  } catch (error) {
    console.error('Unexpected error in photos API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}