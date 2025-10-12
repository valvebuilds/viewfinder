import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const thumbnailBuffer = await sharp(Buffer.from(arrayBuffer))
      .resize(200, 200, { fit: 'inside' })
      .webp()
      .toBuffer();

    // Return the thumbnail as a base64 string or a Blob URL for client-side use
    // For this example, we'll return a base64 string
    const base64Thumbnail = `data:image/webp;base64,${thumbnailBuffer.toString('base64')}`;

    return NextResponse.json({ thumbnailUrl: base64Thumbnail });
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return NextResponse.json({ error: 'Failed to generate thumbnail' }, { status: 500 });
  }
}
