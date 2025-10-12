import { AlbumPreview } from '@/components/AlbumPreview'

interface SharePageProps {
  params: {
    albumId: string
  }
  searchParams: {
    token: string
  }
}

export default function SharePage({ params, searchParams }: SharePageProps) {
  // In a real app, you would validate the token and fetch the album data
  // For now, we'll just display the AlbumPreview component
  return (
    <div className="min-h-screen bg-primary">
      <main className="container mx-auto px-4 py-8">
        <AlbumPreview />
      </main>
    </div>
  )
}
