'use client'

import { useAlbumStore } from '@/store/useAlbumStore'
import { Header } from '@/components/Header'
import { UploadZone } from '@/components/UploadZone'
import { PhotoGrid } from '@/components/PhotoGrid'
import { AlbumEditor } from '@/components/AlbumEditor'
import { AlbumPreview } from '@/components/AlbumPreview'
import { ClientShare } from '@/components/ClientShare'
import { AlbumGenerationPanel } from '@/components/AlbumGenerationPanel'

export default function Home() {
  const { activeView, photos, currentAlbum } = useAlbumStore()

  const renderActiveView = () => {
    switch (activeView) {
      case 'upload':
        return (
          <div className="space-y-8">
            <UploadZone />
            {photos.length > 0 && (
              <>
                <PhotoGrid />
                <AlbumGenerationPanel />
              </>
            )}
          </div>
        )
      case 'editor':
        return <AlbumEditor />
      case 'preview':
        return <AlbumPreview />
      case 'share':
        return <ClientShare />
      default:
        return <UploadZone />
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {renderActiveView()}
      </main>
    </div>
  )
}
