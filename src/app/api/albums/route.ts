import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientForAPI } from '@/lib/supabaseServer'

// GET /api/albums - Get all albums for the current user
export async function GET(req: NextRequest) {
  try {
    const { supabase, applyCookies } = getSupabaseServerClientForAPI(req)
    
    const { data, error: authError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch albums with photo counts
    const { data: albums, error: albumsError } = await supabase
      .from('albums')
      .select('id, name, description, settings, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (albumsError) {
      console.error('Error fetching albums:', albumsError)
      return NextResponse.json({ error: albumsError.message }, { status: 500 })
    }

    // For each album, get the photo count
    const albumsWithPhotoCounts = await Promise.all(
      albums.map(async (album) => {
        const { count } = await supabase
          .from('album_photos')
          .select('*', { count: 'exact', head: true })
          .eq('album_id', album.id)
        
        return {
          ...album,
          photoCount: count || 0
        }
      })
    )

    const response = NextResponse.json({ albums: albumsWithPhotoCounts })
    return applyCookies(response)
  } catch (error: any) {
    console.error('Error in GET /api/albums:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/albums - Create or update an album
export async function POST(req: NextRequest) {
  try {
    const { supabase, applyCookies } = getSupabaseServerClientForAPI(req)
    
    const { data, error: authError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, description, settings, photos } = body

    if (!name) {
      return NextResponse.json({ error: 'Album name is required' }, { status: 400 })
    }

    // Validate UUID format if ID is provided
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    let albumId = id && uuidRegex.test(id) ? id : null

    if (albumId) {
      // Try to update existing album first
      const { data: album, error: updateError } = await supabase
        .from('albums')
        .update({
          name,
          description: description || null,
          settings: settings || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', albumId)
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle()

      if (updateError) {
        console.error('Error updating album:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // If album doesn't exist, create it with the provided ID
      if (!album) {
        console.log('Album not found, creating new album with provided ID:', albumId)
        const insertData = {
          id: albumId, // Use the provided UUID
          user_id: user.id,
          name,
          description: description || null,
          settings: settings || {}
        }
        
        const { data: newAlbum, error: createError } = await supabase
          .from('albums')
          .insert(insertData)
          .select('id')
          .maybeSingle()

        if (createError) {
          console.error('Error creating album with provided ID:', createError)
          return NextResponse.json({ error: createError.message }, { status: 500 })
        }

        if (!newAlbum || !newAlbum.id) {
          console.error('Album creation failed: No album returned')
          return NextResponse.json({ error: 'Failed to create album - no data returned' }, { status: 500 })
        }

        albumId = newAlbum.id
        console.log('Album created successfully with provided ID:', albumId)
      }
    } else {
      // Create new album - Supabase will auto-generate UUID
      const insertData = {
        user_id: user.id,
        name,
        description: description || null,
        settings: settings || {}
      }
      
      console.log('Creating album with data:', { ...insertData, user_id: user.id })
      
      const { data: album, error: createError } = await supabase
        .from('albums')
        .insert(insertData)
        .select('id')
        .maybeSingle()

      if (createError) {
        console.error('Error creating album:', {
          error: createError,
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code
        })
        return NextResponse.json({ 
          error: createError.message,
          details: createError.details,
          hint: createError.hint
        }, { status: 500 })
      }

      if (!album || !album.id) {
        console.error('Album creation failed: No album returned', { album, createError })
        return NextResponse.json({ error: 'Failed to create album - no data returned' }, { status: 500 })
      }

      albumId = album.id
      console.log('Album created successfully:', albumId)
    }

    // Update album_photos if photos array is provided
    if (photos && Array.isArray(photos)) {
      // Delete existing album_photos
      const { error: deleteError } = await supabase
        .from('album_photos')
        .delete()
        .eq('album_id', albumId)

      if (deleteError) {
        console.error('Error deleting album_photos:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      // Insert new album_photos with order
      if (photos.length > 0) {
        const albumPhotos = photos.map((photoId: string, index: number) => ({
          album_id: albumId,
          photo_id: photoId,
          photo_order: index
        }))

        const { error: insertError } = await supabase
          .from('album_photos')
          .insert(albumPhotos)

        if (insertError) {
          console.error('Error inserting album_photos:', insertError)
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }
    }

    const response = NextResponse.json({ 
      id: albumId,
      message: albumId === id ? 'Album updated successfully' : 'Album created successfully'
    })
    return applyCookies(response)
  } catch (error: any) {
    console.error('Error in POST /api/albums:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

