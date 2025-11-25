import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getSupabaseServerClientForAPI } from '@/lib/supabaseServer'
import { STORAGE_BUCKET, THUMBNAIL_CONFIG } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    // Create server client with request cookies
    const { supabase, applyCookies } = getSupabaseServerClientForAPI(req)
    
    const { data, error: authError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    
    // Get image metadata to determine best resize strategy
    const metadata = await sharp(imageBuffer).metadata();
    
    // Calculate optimal thumbnail dimensions
    // Maintain aspect ratio, max width/height for better quality
    // Use 'inside' to ensure image fits within bounds without cropping
    const maxDimension = Number(THUMBNAIL_CONFIG.maxDimension);
    let width: number = maxDimension;
    let height: number = maxDimension;
    
    if (metadata.width && metadata.height) {
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio > 1) {
        // Landscape: width is larger
        height = Math.round(maxDimension / aspectRatio);
      } else {
        // Portrait or square: height is larger or equal
        width = Math.round(maxDimension * aspectRatio);
      }
    }
    
    // Generate high-quality thumbnail with optimized settings
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true, // Don't upscale small images
        kernel: sharp.kernel.lanczos3, // High-quality resampling
      })
      .webp({
        quality: THUMBNAIL_CONFIG.quality, // Balance between quality and file size
        effort: 6, // Compression effort (0-6, higher = better compression but slower)
        smartSubsample: true, // Better quality for smaller files
      })
      .toBuffer();

    // Log thumbnail generation stats
    const originalSize = imageBuffer.length;
    const thumbnailSize = thumbnailBuffer.length;
    const sizeReduction = ((originalSize - thumbnailSize) / originalSize * 100).toFixed(1);
    console.log(`Thumbnail generated: ${metadata.width}x${metadata.height} → ${width}x${height}, ${(originalSize / 1024).toFixed(1)}KB → ${(thumbnailSize / 1024).toFixed(1)}KB (${sizeReduction}% reduction)`);

    // Store thumbnails in user-specific folder to match main photo structure
    const originalName = imageFile.name || `image-${Date.now()}.jpg`
    const baseName = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName
    const thumbnailPath = `${user.id}/thumbnails/${baseName}.webp`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/webp',
        upsert: true,
      })

    if (uploadError) {
      console.error('Thumbnail upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Generate signed URL (expires in 1 year - 31536000 seconds)
    // This allows access to private bucket without making it public
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(thumbnailPath, 31536000)
    
    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Failed to generate signed URL for thumbnail:', signedUrlError)
      return NextResponse.json({ 
        error: 'Failed to generate signed URL',
        details: signedUrlError?.message 
      }, { status: 500 })
    }

    console.log('Thumbnail uploaded successfully:', { thumbnailPath, signedUrl: signedUrlData.signedUrl })

    const response = NextResponse.json({ thumbnailPath, thumbnailUrl: signedUrlData.signedUrl })
    return applyCookies(response)
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return NextResponse.json({ error: 'Failed to generate thumbnail' }, { status: 500 });
  }
}
