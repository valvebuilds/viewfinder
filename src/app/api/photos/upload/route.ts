import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientForAPI } from '@/lib/supabaseServer'
import { STORAGE_BUCKET } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    // Create server client with request cookies
    const { supabase, applyCookies } = getSupabaseServerClientForAPI(req)
    
    // Always use getUser() to authenticate - never trust session.user directly
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Create user-specific path to organize files
    const filePath = `${user.id}/${file.name}`
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload file using server client (has proper permissions)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ 
        error: uploadError.message,
        name: uploadError.name
      }, { status: 500 })
    }

    // Generate signed URL (expires in 1 year - 31536000 seconds)
    // This allows access to private bucket without making it public
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(uploadData.path, 31536000)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Failed to generate signed URL:', signedUrlError)
      return NextResponse.json({ 
        error: 'Failed to generate signed URL',
        details: signedUrlError?.message 
      }, { status: 500 })
    }

    const response = NextResponse.json({
      path: uploadData.path,
      url: signedUrlData.signedUrl,
    })
    return applyCookies(response)
  } catch (error: any) {
    console.error('Unexpected error in upload API:', error)
    return NextResponse.json({ 
      error: error?.message || 'Failed to upload file' 
    }, { status: 500 })
  }
}

