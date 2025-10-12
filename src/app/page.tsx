'use client'

import { useAlbumStore } from '@/store/useAlbumStore'
import { Header } from '@/components/Header'
import { UploadZone } from '@/components/UploadZone'
import { PhotoGrid } from '@/components/PhotoGrid'
import { AlbumEditor } from '@/components/AlbumEditor'
import { AlbumPreview } from '@/components/AlbumPreview'
import { ClientShare } from '@/components/ClientShare'
import { AlbumGenerationPanel } from '@/components/AlbumGenerationPanel'
import { UserButton } from '@clerk/nextjs/server'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <UserButton afterSignOutUrl="/" />
      <p>This is the main page</p>
    </main>
  );
}
