'use client'

import { useAlbumStore } from '@/store/useAlbumStore'
import { UploadZone } from '@/components/UploadZone'
import { PhotoGrid } from '@/components/PhotoGrid'
import { AlbumGenerationPanel } from '@/components/AlbumGenerationPanel'
import { AlbumEditor } from '@/components/AlbumEditor'
import { AlbumPreview } from '@/components/AlbumPreview'
import { ClientShare } from '@/components/ClientShare'
import { Header } from '@/components/Header'

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
    <div className="min-h-screen bg-primary">
      <main className="container mx-auto px-4 py-8">
        {renderActiveView()}
      </main>
    </div>
  )
}
