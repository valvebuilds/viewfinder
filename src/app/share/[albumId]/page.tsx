'use client'

import { useState, useEffect, use } from 'react'
import { useAlbumStore } from '@/store/useAlbumStore'
import { Copy, Download, Globe, Lock, Facebook, Instagram, Share2, Code, Mail, Twitter } from 'lucide-react'
import toast from 'react-hot-toast'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import Image from 'next/image'
import type { Album } from '@/types'

interface SharePageProps {
  params: Promise<{
    albumId: string
  }>
  searchParams?: Promise<{
    token?: string
  }>
}

export default function SharePage({ params, searchParams }: SharePageProps) {
  const resolvedParams = use(params)
  const { currentAlbum, setCurrentAlbum } = useAlbumStore()
  const [album, setAlbum] = useState<Album | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPublic, setIsPublic] = useState(true)
  const [requirePassword, setRequirePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [albumUrl, setAlbumUrl] = useState('')
  const [isLinkGenerated, setIsLinkGenerated] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)

  const generateShareLink = async () => {
    setIsGeneratingLink(true)
    // Simulate API call or token generation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (typeof window !== 'undefined') {
      const token = Math.random().toString(36).substr(2, 9)
      const link = `${window.location.origin}/share/${resolvedParams.albumId}${token ? `?token=${token}` : ''}`
      setAlbumUrl(link)
      setIsLinkGenerated(true)
      toast.success('Share link generated!')
    }
    setIsGeneratingLink(false)
  }

  useEffect(() => {
    // Auto-generate link on mount if album is loaded
    if (album && !isLinkGenerated && !isGeneratingLink) {
      generateShareLink()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album?.id])

  useEffect(() => {
    const loadAlbum = async () => {
      setLoading(true)
      
      // First, check if album is in store
      if (currentAlbum && currentAlbum.id === resolvedParams.albumId) {
        setAlbum(currentAlbum)
        setLoading(false)
        return
      }

      // Try to load from localStorage
      try {
        const storedAlbums = localStorage.getItem('viewfinder-albums')
        if (storedAlbums) {
          const albums: Album[] = JSON.parse(storedAlbums)
          const foundAlbum = albums.find(a => a.id === resolvedParams.albumId)
          if (foundAlbum) {
            // Convert date strings back to Date objects
            const albumWithDates: Album = {
              ...foundAlbum,
              createdAt: new Date(foundAlbum.createdAt),
              updatedAt: new Date(foundAlbum.updatedAt),
            }
            setAlbum(albumWithDates)
            setCurrentAlbum(albumWithDates)
            setLoading(false)
            return
          }
        }
      } catch (error) {
        console.error('Error loading album from localStorage:', error)
      }

      // Try to fetch from API (if we implement it later)
      try {
        const response = await fetch(`/api/albums/${resolvedParams.albumId}`, {
          credentials: 'include',
        })
        
        if (response.ok) {
          const albumData = await response.json()
          // Convert date strings to Date objects
          const albumWithDates: Album = {
            ...albumData,
            createdAt: new Date(albumData.createdAt),
            updatedAt: new Date(albumData.updatedAt),
          }
          setAlbum(albumWithDates)
          setCurrentAlbum(albumWithDates)
          setLoading(false)
          return
        }
      } catch (error) {
        console.error('Error fetching album from API:', error)
      }

      // If we get here, album was not found
      setLoading(false)
    }

    loadAlbum()
  }, [resolvedParams.albumId, currentAlbum, setCurrentAlbum])

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-400">Loading album...</p>
        </div>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold text-primary mb-2">Album Not Found</h2>
          <p className="text-secondary-400">The album you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  const embedCode = `<iframe src="${albumUrl}/embed" width="100%" height="600" frameborder="0"></iframe>`

  const handleCopyLink = () => {
    if (albumUrl) {
      navigator.clipboard.writeText(albumUrl)
      toast.success('Album link copied!')
    }
  }

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode)
    toast.success('Embed code copied!')
  }

  const handleDownload = async () => {
    if (!album || album.photos.length === 0) {
      toast.error('No photos to download')
      return
    }

    toast.loading('Preparing download...')

    try {
      const zip = new JSZip()
      const folder = zip.folder(album.name)

      for (const photo of album.photos) {
        try {
          const response = await fetch(photo.url)
          if (!response.ok) {
            throw new Error(`Failed to fetch photo ${photo.name}`)
          }
          const blob = await response.blob()
          folder?.file(photo.name, blob)
        } catch (error) {
          console.error(`Failed to add photo ${photo.name} to zip:`, error)
        }
      }

      zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, `${album.name}-export.zip`)
        toast.dismiss()
        toast.success('Download started!')
      })
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to create download')
      console.error('Download error:', error)
    }
  }

  const handleSocialShare = (platform: string) => {
    const text = `Check out this album: ${album.name}`
    const url = albumUrl
    
    let shareUrl = ''
    switch (platform) {
      case 'Facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'Instagram':
        toast('Copy the link and share it on Instagram', { icon: '📸' })
        return
      case 'Twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        break
      case 'Pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`
        break
      default:
        return
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="min-h-screen bg-charcoal">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">Share Your Album</h2>
          <p className="text-secondary-400">Distribute your curated album across multiple channels</p>
        </div>

        <div className="space-y-6">
          {/* Album Info */}
          <div className="bg-secondary rounded-xl border border-secondary-600 p-6">
            <div className="flex items-start space-x-4">
              {album.coverPhoto && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                  <Image
                    src={album.coverPhoto.thumbnailUrl || album.coverPhoto.url}
                    alt={album.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized={(album.coverPhoto.thumbnailUrl || album.coverPhoto.url)?.includes('supabase.co') || (album.coverPhoto.thumbnailUrl || album.coverPhoto.url)?.includes('supabase.in')}
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-primary mb-1">{album.name}</h3>
                <p className="text-secondary-400 text-sm">
                  {album.photos.length} photos • {album.settings.curationAlgorithm}
                </p>
              </div>
            </div>
          </div>

          {/* Access Settings */}
          <div className="bg-secondary rounded-xl border border-secondary-600 p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Access Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Globe className="h-5 w-5 text-primary" />
                  ) : (
                    <Lock className="h-5 w-5 text-secondary-400" />
                  )}
                  <div>
                    <label htmlFor="public-toggle" className="font-medium text-primary block">
                      {isPublic ? 'Public Album' : 'Private Album'}
                    </label>
                    <p className="text-sm text-secondary-400">
                      {isPublic ? 'Anyone with the link can view' : 'Only you can access this album'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="public-toggle"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {isPublic && (
                <div className="flex items-center justify-between pt-4 border-t border-secondary-600">
                  <div>
                    <label htmlFor="password-toggle" className="font-medium text-primary block">
                      Require Password
                    </label>
                    <p className="text-sm text-secondary-400">Add an extra layer of security</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="password-toggle"
                      checked={requirePassword}
                      onChange={(e) => setRequirePassword(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-secondary-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              )}

              {requirePassword && (
                <div className="pt-2">
                  <label htmlFor="password" className="block text-sm font-medium text-primary mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-charcoal border border-secondary-600 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Share Options */}
          <div className="bg-secondary rounded-xl border border-secondary-600 p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Share Options</h3>
            <div className="space-y-4">
              {/* Copy Link */}
              <div>
                <label htmlFor="album-url" className="block text-sm font-medium text-primary mb-2">
                  Album URL
                </label>
                <div className="flex gap-2">
                  <input
                    id="album-url"
                    value={albumUrl || 'Click "Generate" to create share link'}
                    readOnly
                    className="flex-1 px-4 py-2 bg-charcoal border border-secondary-600 rounded-lg text-primary focus:outline-none"
                  />
                  {isLinkGenerated ? (
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center"
                      title="Copy link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={generateShareLink}
                      disabled={isGeneratingLink || !album}
                      className="px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Generate share link"
                    >
                      {isGeneratingLink ? (
                        <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Download ZIP */}
              <button
                onClick={handleDownload}
                className="w-full px-4 py-2 bg-transparent border border-secondary-600 text-primary rounded-lg hover:bg-secondary-600 transition-colors flex items-center justify-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Download ZIP of Curated Photos
              </button>

              {/* Generate Public Gallery */}
              <button
                onClick={generateShareLink}
                disabled={isGeneratingLink || !album}
                className="w-full px-4 py-2 bg-transparent border border-secondary-600 text-primary rounded-lg hover:bg-secondary-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingLink ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    <span>{isLinkGenerated ? 'Regenerate Public Gallery Link' : 'Generate Public Gallery Page'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-secondary rounded-xl border border-secondary-600 p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Social Media</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialShare('Instagram')}
                className="px-4 py-2 bg-transparent border border-secondary-600 text-primary rounded-lg hover:bg-secondary-600 transition-colors flex items-center justify-start"
              >
                <Instagram className="mr-2 h-4 w-4" />
                Share to Instagram
              </button>
              <button
                onClick={() => handleSocialShare('Facebook')}
                className="px-4 py-2 bg-transparent border border-secondary-600 text-primary rounded-lg hover:bg-secondary-600 transition-colors flex items-center justify-start"
              >
                <Facebook className="mr-2 h-4 w-4" />
                Share to Facebook
              </button>
              <button
                onClick={() => handleSocialShare('Pinterest')}
                className="px-4 py-2 bg-transparent border border-secondary-600 text-primary rounded-lg hover:bg-secondary-600 transition-colors flex items-center justify-start"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share to Pinterest
              </button>
              <button
                onClick={() => handleSocialShare('Twitter')}
                className="px-4 py-2 bg-transparent border border-secondary-600 text-primary rounded-lg hover:bg-secondary-600 transition-colors flex items-center justify-start"
              >
                <Twitter className="mr-2 h-4 w-4" />
                Share to Twitter
              </button>
            </div>
          </div>

          {/* Embed Code */}
          <div className="bg-secondary rounded-xl border border-secondary-600 p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Embed on Website</h3>
            <div>
              <label htmlFor="embed-code" className="block text-sm font-medium text-primary mb-2">
                Custom Embed Code
              </label>
              <div className="flex gap-2">
                <input
                  id="embed-code"
                  value={embedCode}
                  readOnly
                  className="flex-1 px-4 py-2 bg-charcoal border border-secondary-600 rounded-lg text-primary font-mono text-xs focus:outline-none"
                />
                <button
                  onClick={handleCopyEmbed}
                  className="px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center"
                >
                  <Code className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
