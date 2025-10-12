import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { imageUrl } = await req.json();

  if (!imageUrl) {
    return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
  }

  // Mock AI analysis result
  const mockAnalysis = {
    photoId: imageUrl, // Using imageUrl as a unique identifier for mock purposes
    scores: {
      composition: Math.floor(Math.random() * 40 + 60), // 60-100
      lighting: Math.floor(Math.random() * 40 + 60),
      color: Math.floor(Math.random() * 40 + 60),
      sharpness: Math.floor(Math.random() * 40 + 60),
      overall: Math.floor(Math.random() * 40 + 60),
    },
    tags: ['mock-tag-1', 'mock-tag-2'],
    colorPalette: ['#FF0000', '#00FF00', '#0000FF'],
    dominantColor: '#FF0000',
    metadata: {
      brightness: Math.floor(Math.random() * 100),
      contrast: Math.floor(Math.random() * 100),
      saturation: Math.floor(Math.random() * 100),
      temperature: Math.floor(Math.random() * 100),
    },
  };

  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call delay

  return NextResponse.json(mockAnalysis);
}
