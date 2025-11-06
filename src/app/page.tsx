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

export default function Home() {
  const { activeView, photos, currentAlbum } = useAlbumStore()
  const { fetchPhotos } = useAlbumStore()
  const [userLoaded, setUserLoaded] = useState(false)
  const supabase = getSupabaseBrowserClient()
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    // Check if user is authenticated before fetching photos
    const checkUserAndFetch = async () => {
      try {
        // Try getSession first (this checks cookies/localStorage)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (sessionError) {
          console.error('Error getting session:', sessionError)
          // If session error, try getUser as fallback
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          if (userError || !user) {
            setUserLoaded(true)
            return
          }
          if (user && !hasFetchedRef.current) {
            hasFetchedRef.current = true
            await fetchPhotos()
          }
          setUserLoaded(true)
          return
        }

        // If we have a session, use it
        if (session?.user && !hasFetchedRef.current) {
          hasFetchedRef.current = true
          await fetchPhotos()
        }
        setUserLoaded(true)
      } catch (error) {
        console.error('Error in checkUserAndFetch:', error)
        if (mounted) setUserLoaded(true)
      }
    }

    checkUserAndFetch()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (!mounted) return

      if (session?.user) {
        // User is authenticated (signed in or session restored)
        if (event === 'SIGNED_IN') {
          // User just signed in, fetch photos
          hasFetchedRef.current = true
          fetchPhotos()
        } else if (event === 'INITIAL_SESSION' && !hasFetchedRef.current) {
          // Initial session load, fetch photos if not already fetched
          hasFetchedRef.current = true
          fetchPhotos()
        }
        setUserLoaded(true)
      } else {
        // User signed out
        if (event === 'SIGNED_OUT') {
          hasFetchedRef.current = false
          useAlbumStore.getState().reset()
        }
        setUserLoaded(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchPhotos, supabase])

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
