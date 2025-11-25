import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientForAPI } from '@/lib/supabaseServer'

// GET /api/albums/[id] - Get a specific album with its photos
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, applyCookies } = getSupabaseServerClientForAPI(req)
    const { id } = await params
    
    const { data, error: authError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch album
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select('id, name, description, settings, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (albumError) {
      console.error('Error fetching album:', albumError)
      return NextResponse.json({ error: albumError.message }, { status: 500 })
    }

    if (!album) {
      console.log('Album not found:', { id, userId: user.id })
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    // Fetch album photos with photo details, ordered by photo_order
    const { data: albumPhotos, error: albumPhotosError } = await supabase
      .from('album_photos')
      .select(`
        photo_order,
        photos (
          id,
          path,
          thumbnail_path,
          mime,
          created_at,
          user_id
        )
      `)
      .eq('album_id', id)
      .order('photo_order', { ascending: true })

    if (albumPhotosError) {
      console.error('Error fetching album photos:', albumPhotosError)
      return NextResponse.json({ error: albumPhotosError.message }, { status: 500 })
    }

    // Transform the data to match the Album interface
    const photos = (albumPhotos || [])
      .filter(ap => ap.photos) // Filter out any null photos
      .map((ap: any) => {
        const photo = ap.photos
        return {
          id: photo.id,
          url: photo.path,
          thumbnailUrl: photo.thumbnail_path || photo.path,
          name: photo.path.split('/').pop() || 'Untitled',
          size: 0,
          type: photo.mime || 'image/jpeg',
          file: null as any,
          metadata: {}
        }
      })

    const response = NextResponse.json({
      ...album,
      photos,
      createdAt: album.created_at,
      updatedAt: album.updated_at
    })
    return applyCookies(response)
  } catch (error: any) {
    console.error('Error in GET /api/albums/[id]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/albums/[id] - Delete an album
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, applyCookies } = getSupabaseServerClientForAPI(req)
    const { id } = await params
    
    const { data, error: authError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete album (album_photos will be deleted automatically due to CASCADE)
    const { error: deleteError } = await supabase
      .from('albums')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting album:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const response = NextResponse.json({ message: 'Album deleted successfully' })
    return applyCookies(response)
  } catch (error: any) {
    console.error('Error in DELETE /api/albums/[id]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

