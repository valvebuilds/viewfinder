'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAlbumStore } from '@/store/useAlbumStore'
import { Cloud, Upload, Image, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export function UploadZone() {
  const { addPhotos, setUploadProgress, updateUploadProgress, photos } = useAlbumStore()
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsUploading(true)
    const newPhotos: any[] = []
    const progressItems: any[] = []

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

        // Create photo object
        const photo = {
          id: `photo-${Date.now()}-${i}`,
          file,
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          type: file.type,
          metadata: {
            colorPalette: ['#3b82f6', '#10b981', '#f59e0b'], // Mock data
            dominantColor: '#3b82f6',
            brightness: Math.random() * 100,
            contrast: Math.random() * 100
          }
        }

        newPhotos.push(photo)
        updateUploadProgress(fileId, { status: 'completed', progress: 100 })

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500))

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
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.tiff', '.bmp']
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
            ? 'border-primary-400 bg-primary-900/20 scale-105 shadow-lg' 
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
              <Upload className="w-12 h-12 text-primary-500" />
              <p className="text-lg font-medium text-primary-700">Drop photos here</p>
              <p className="text-sm text-primary-600">Release to upload</p>
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
                      className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                    />
                  </motion.div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-alabaster-300">
                  Upload Your Photos
                </h3>
                <p className="text-secondary-400 max-w-md">
                  Drag and drop your photos here, or click to browse. 
                  Supports JPEG, PNG, GIF, WebP, and more.
                </p>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-secondary-400">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-accent-saffron" />
                  <span>Up to 50MB per file</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-accent-saffron" />
                  <span>Batch upload supported</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>


      {/* Upload Stats */}
      {photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-alabaster-300">Upload Summary</h4>
            <span className="text-sm text-secondary-400">{photos.length} photos</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-400">{photos.length}</div>
              <div className="text-sm text-secondary-400">Total Photos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent-saffron">
                {formatFileSize(photos.reduce((sum, photo) => sum + photo.size, 0))}
              </div>
              <div className="text-sm text-secondary-400">Total Size</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-platinum-400">
                {new Set(photos.map(p => p.type.split('/')[0])).size}
              </div>
              <div className="text-sm text-secondary-400">Formats</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
