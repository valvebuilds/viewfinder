'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAlbumStore } from '@/store/useAlbumStore'
import { Upload, Image } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { STORAGE_BUCKET } from '@/lib/constants'
import { aiAnalyzer } from '@/lib/aiAnalysis';
import { Photo, UploadProgress } from '@/types';

export function UploadZone() {
  const { addPhotos, setUploadProgress, updateUploadProgress } = useAlbumStore()
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsUploading(true)
    const newPhotos: Photo[] = []
    const progressItems: UploadProgress[] = []

    // Initialize progress tracking
    acceptedFiles.forEach((file) => {
      const fileId = `file-${Date.now()}-${Math.random()}`
      progressItems.push({
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading' as const
      })
    })
    setUploadProgress(progressItems)

    // Process each file
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      const fileId = progressItems[i].fileId

      try {
        // Update progress to processing
        updateUploadProgress(fileId, { status: 'processing', progress: 50 })

        // Upload file via API route (uses server client with proper permissions)
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        
        const uploadResponse = await fetch('/api/photos/upload', {
          method: 'POST',
          body: uploadFormData,
          credentials: 'include',
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || 'Failed to upload file')
        }

        const { path, url: publicUrl } = await uploadResponse.json()

        // Create thumbnail
        
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('image', file);
        const thumbnailResponse = await fetch('/api/generate-thumbnail', {
          method: 'POST',
          body: thumbnailFormData,
        });

        if (!thumbnailResponse.ok) {
          throw new Error('Failed to generate thumbnail');
        }

        const { thumbnailUrl, thumbnailPath } = await thumbnailResponse.json();

        // Persist DB row for this photo (server inserts Supabase user)
        const createResponse = await fetch('/api/photos/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            path: path,
            thumbnailPath,
            mime: file.type,
          }),
        });

        const createResult = await createResponse.json()

        if (!createResponse.ok) {
          console.error('Failed to create photo record:', createResult)
          throw new Error(createResult.error || 'Failed to create photo record in database')
        }

        console.log('Photo record created:', createResult)

        // Perform AI analysis
        const analysis = await aiAnalyzer.analyzePhoto(file);

        // Create photo object
        const photo: Photo = {
          id: path,
          file,
          url: publicUrl,
          thumbnailUrl,
          name: file.name,
          size: file.size,
          type: file.type,
          metadata: {
            colorPalette: analysis.colorPalette,
            dominantColor: analysis.dominantColor,
            brightness: analysis.metadata.brightness,
            contrast: analysis.metadata.contrast,
            tags: analysis.tags,
          }
        };
        newPhotos.push(photo);
        updateUploadProgress(fileId, { status: 'completed', progress: 100 });

      } catch (error) {
        console.error('Error processing file:', error)
        updateUploadProgress(fileId, { 
          status: 'error', 
          progress: 0, 
          error: 'Failed to process file' 
        })
        toast.error(`Failed to process ${file.name}`)
      }
    }

    if (newPhotos.length > 0) {
      addPhotos(newPhotos)
      toast.success(`Successfully uploaded ${newPhotos.length} photos`)
    }

    setIsUploading(false)
  }, [addPhotos, setUploadProgress, updateUploadProgress])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.tiff', '.bmp', '.JXL']
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isUploading
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 artsy-hover
          ${isDragActive && !isDragReject 
            ? 'border-primary bg-primary/20 scale-105 shadow-lg' 
            : isDragReject
            ? 'border-red-400 bg-red-900/20'
            : 'border-secondary-600 hover:border-primary-400 hover:bg-primary-900/10'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: isDragActive ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex flex-col items-center space-y-4"
        >
          {isDragActive ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center space-y-2"
            >
              <Upload className="w-12 h-12 text-accent" />
              <p className="text-lg font-medium text-secondary">Drop photos here</p>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-800 to-platinum-800 rounded-2xl flex items-center justify-center shadow-lg">
                  <Image className="w-8 h-8 text-primary-300" />
                </div>
                {isUploading && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                    />
                  </motion.div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-accent">
                  Upload Photos
                </h3>
                <p className="text-secondary-400 max-w-md">
                  Drag and drop, or click to browse. 
                </p>
              </div>
            
            </div>
          )}
        </motion.div>
      </div>

    </div>
  )
}
