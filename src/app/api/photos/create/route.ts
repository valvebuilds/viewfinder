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

    const { path, thumbnailPath, mime } = await req.json()
    if (!path || !mime) {
      return NextResponse.json({ error: 'path and mime are required' }, { status: 400 })
    }

    // Note: user_id must be UUID type in the photos table, not bigint
    console.log('Creating photo record:', { path, thumbnailPath, mime, userId: user.id })
    
    const { data, error } = await supabase
      .from('photos')
      .insert({
        path,
        thumbnail_path: thumbnailPath || null,
        mime,
        user_id: user.id,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Database insert error:', error)
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
      console.error('No data returned from insert')
      return NextResponse.json({ error: 'Failed to create photo record - no data returned' }, { status: 500 })
    }

    console.log('Photo record created successfully:', data)
    const response = NextResponse.json({ id: data.id })
    return applyCookies(response)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create photo' }, { status: 500 })
  }
}
