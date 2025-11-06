import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientForAPI } from '@/lib/supabaseServer'
import { STORAGE_BUCKET } from '@/lib/constants'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params
    const { supabase, applyCookies } = getSupabaseServerClientForAPI(req)
    
    // Always use getUser() to authenticate - never trust session.user directly
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch photo record from database
    const { data: photoRecord, error: fetchError } = await supabase
      .from('photos')
      .select('id, path, thumbnail_path, mime, created_at, user_id')
      .eq('id', photoId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !photoRecord) {
      return NextResponse.json({ 
        error: 'Photo not found',
        details: fetchError?.message 
      }, { status: 404 })
    }

    // Generate fresh signed URL for full-size photo (expires in 1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(photoRecord.path, 31536000)

    if (urlError || !urlData?.signedUrl) {
      console.error('Failed to generate signed URL:', urlError)
      return NextResponse.json({ 
        error: 'Failed to generate signed URL',
        details: urlError?.message 
      }, { status: 500 })
    }

    // Generate signed URL for thumbnail if it exists
    let thumbnailUrl: string | null = null
    if (photoRecord.thumbnail_path) {
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(photoRecord.thumbnail_path, 31536000)
      thumbnailUrl = thumbError || !thumbData?.signedUrl ? null : thumbData.signedUrl
    }

    const response = NextResponse.json({
      id: String(photoRecord.id),
      url: urlData.signedUrl,
      thumbnailUrl,
      name: photoRecord.path.split('/').pop() || String(photoRecord.id),
      size: 0,
      type: photoRecord.mime || 'application/octet-stream',
      createdAt: photoRecord.created_at,
    })
    
    return applyCookies(response)
  } catch (error: any) {
    console.error('Unexpected error in photo API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message 
    }, { status: 500 })
  }
}

