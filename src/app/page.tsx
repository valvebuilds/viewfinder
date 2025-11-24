'use client'

import { useAlbumStore } from '@/store/useAlbumStore'
import { UploadZone } from '@/components/UploadZone'
import { PhotoGrid } from '@/components/PhotoGrid'
import { AlbumGenerationPanel } from '@/components/AlbumGenerationPanel'
import { AlbumEditor } from '@/components/AlbumEditor'
import { AlbumPreview } from '@/components/AlbumPreview'
import { ClientShare } from '@/components/ClientShare'
import { Header } from '@/components/Header'
import { useEffect, useState, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'

export default function Home() {
  const { activeView, photos, currentAlbum, fetchPhotos, reset } = useAlbumStore()
  const [userLoaded, setUserLoaded] = useState(false)
  const supabase = getSupabaseBrowserClient()
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    const handleAuthEvent = async (session: Session | null) => {
      if (!mounted) return;

      if (session?.user) {
        if (!hasFetchedRef.current && photos.length === 0) {
          hasFetchedRef.current = true;
          await fetchPhotos(0, 20); // Add offset and limit here
        }
        setUserLoaded(true);
      } else {
        hasFetchedRef.current = false;
        reset();
        setUserLoaded(false);
      }
    };

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      handleAuthEvent(session);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        handleAuthEvent(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, photos.length, reset, fetchPhotos]);

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
    <div className="min-h-screen bg-baby-powder">
      <main className="container mx-auto px-4 py-8">
        {renderActiveView()}
      </main>
    </div>
  )
}
