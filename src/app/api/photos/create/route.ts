import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientForAPI } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    // Create server client with request cookies
    const { supabase, applyCookies } = getSupabaseServerClientForAPI(req)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, path: fullSignedUrl, mime, thumbnailUrl: thumbnailSignedUrl } = await req.json()
    if (!fullSignedUrl || !mime || !thumbnailSignedUrl) {
      return NextResponse.json({ error: 'fullSignedUrl, mime, and thumbnailSignedUrl are required' }, { status: 400 })
    }

    // Note: user_id must be UUID type in the photos table, not bigint
    console.log('Creating/Updating photo record:', { id, fullSignedUrl, mime, userId: user.id, thumbnailSignedUrl })
    
    let data, error;

    if (id) {
      // Update existing photo
      ({ data, error } = await supabase
        .from('photos')
        .update({
          path: fullSignedUrl,
          mime,
          thumbnail_path: thumbnailSignedUrl,
          // user_id is not updated as it should be immutable
        })
        .eq('id', id)
        .select('id')
        .single());
    } else {
      // Insert new photo
      ({ data, error } = await supabase
        .from('photos')
        .insert({
          path: fullSignedUrl,
          mime,
          user_id: user.id,
          thumbnail_path: thumbnailSignedUrl,
        })
        .select('id')
        .single());
    }

    if (error) {
      console.error('Database operation error:', error)
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

    if (!data) {
      console.error('No data returned from operation')
      return NextResponse.json({ error: 'Failed to create/update photo record - no data returned' }, { status: 500 })
    }

    console.log('Photo record created/updated successfully:', data)
    const response = NextResponse.json({ id: data.id })
    return applyCookies(response)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create photo' }, { status: 500 })
  }
}
