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
import imageCompression from 'browser-image-compression';
import { invalidateCache } from '@/lib/apiCache';

const MAX_CONCURRENT_UPLOADS = 1; // Temporarily reduced for debugging timeouts

// Options for full-resolution image compression
const FULL_RES_COMPRESSION_OPTIONS = {
  maxSizeMB: 5, // Maximum file size (e.g., 5MB)
  maxWidthOrHeight: 1920, // Max width or height (e.g., for common display resolutions)
  useWebWorker: true, // Use web worker for better performance
  fileType: "image/jpeg", // Output format
};

// Basic concurrency limiter function
async function concurrentQueue<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<any>[] = [];

  for (const task of tasks) {
    const promise = task();
    executing.push(promise);
    promise.then((result) => {
      results.push(result);
      executing.splice(executing.indexOf(promise), 1);
    });

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

export function UploadZone() {
  const { addPhotos, setUploadProgress, updateUploadProgress, updatePhoto, fetchPhotos } = useAlbumStore()
  const [isUploading, setIsUploading] = useState(false)

  const processFullResolutionPhoto = useCallback(async (file: File, fileId: string, photoId: string, thumbnailSignedUrl: string) => {
    console.log(`Starting processFullResolutionPhoto for ${file.name} (fileId: ${fileId}, photoId: ${photoId})`);
    try {
      updateUploadProgress(fileId, { status: 'compressing full-res', progress: 70 });

      // Compress the full-resolution file client-side
      const compressedFullResFile = await imageCompression(file, FULL_RES_COMPRESSION_OPTIONS);
      const fullResFileToUpload = new File([compressedFullResFile], file.name, { type: compressedFullResFile.type });

      updateUploadProgress(fileId, { status: 'uploading full-res', progress: 75 });

      const uploadFormData = new FormData();
      uploadFormData.append('file', fullResFileToUpload);

      console.time(`Full-res upload for ${file.name}`);
      let uploadResponse;
      try {
        uploadResponse = await fetch('/api/photos/upload', {
          method: 'POST',
          body: uploadFormData,
          credentials: 'include',
        });
      } catch (error: any) {
        console.error('Network error during full-resolution upload:', error);
        throw new Error(`Network error during full-resolution upload: ${error.message}`)
      } finally {
        console.timeEnd(`Full-res upload for ${file.name}`);
      }

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload full-resolution file');
      }

      const { path: fullBucketPath, url: fullSignedUrl } = await uploadResponse.json();

      // Update DB record with full-res data
      const updateBody = JSON.stringify({
        id: photoId,
        path: fullSignedUrl, // Update 'path' with full signed URL
        mime: file.type,
        thumbnailUrl: thumbnailSignedUrl, // Keep thumbnail signed URL
      });
      console.log('updatePhotoRequest Body:', updateBody);

      console.time(`DB update for ${file.name}`);
      let updatePhotoResponse;
      try {
        updatePhotoResponse = await fetch('/api/photos/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: updateBody,
        });
      } catch (error: any) {
        console.error('Network error during update photo record:', error);
        throw new Error(`Network error during update photo record: ${error.message}`)
      } finally {
        console.timeEnd(`DB update for ${file.name}`);
      }

      const updatePhotoResult = await updatePhotoResponse.json();

      if (!updatePhotoResponse.ok) {
        console.error('Failed to update photo record with full-res details:', updatePhotoResult);
        throw new Error(updatePhotoResult.error || 'Failed to update photo record in database');
      }
      console.log('Photo record updated with full-res details:', updatePhotoResult);

      console.time(`AI analysis for ${file.name}`);
      // Perform AI analysis
      const analysis = await aiAnalyzer.analyzePhoto(file);
      console.timeEnd(`AI analysis for ${file.name}`);

      // Update photo in store with full-res URL and AI analysis
      updatePhoto(photoId, {
        url: fullSignedUrl,
        metadata: {
          colorPalette: analysis.colorPalette,
          dominantColor: analysis.dominantColor,
          brightness: analysis.metadata.brightness,
          contrast: analysis.metadata.contrast,
          tags: analysis.tags,
        },
      });
      invalidateCache('photos'); // Explicitly invalidate cache just before fetching
      updateUploadProgress(fileId, { status: 'completed', progress: 100 });
      toast.success(`Full-resolution photo for ${file.name} uploaded and processed!`);

    } catch (error) {
      console.error(`Error processing full-resolution file ${file.name}:`, error);
      updateUploadProgress(fileId, { 
        status: 'error', 
        progress: 0, 
        error: `Failed to process full-resolution file: ${error}` 
      });
      toast.error(`Failed to process full-resolution for ${file.name}`);
    }
  }, [updatePhoto, updateUploadProgress, fetchPhotos]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsUploading(true)
    const progressItems: UploadProgress[] = []

    // Initialize progress tracking
    const filesWithIds = acceptedFiles.map(file => {
      const fileId = `file-${Date.now()}-${Math.random()}`;
      progressItems.push({
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading' as const
      });
      return { file, fileId };
    });
    setUploadProgress(progressItems);

    const uploadTasks = filesWithIds.map(({ file, fileId }) => async () => {
      try {
        updateUploadProgress(fileId, { status: 'processing', progress: 10 });

        // 1. Generate thumbnail client-side
        const options = {
          maxSizeMB: 0.5, // (max file size < 1MB)
          maxWidthOrHeight: 400, // compressed image's max width or height is 400px
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const thumbnailFile = new File([compressedFile], `thumbnail-${file.name}`, { type: compressedFile.type });

        updateUploadProgress(fileId, { status: 'uploading thumbnail', progress: 30 });

        // 2. Upload thumbnail immediately
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('file', thumbnailFile);
        thumbnailFormData.append('isThumbnail', 'true'); // Indicate this is a thumbnail

        let thumbnailUploadResponse;
        try {
          thumbnailUploadResponse = await fetch('/api/photos/upload', {
            method: 'POST',
            body: thumbnailFormData,
            credentials: 'include',
          });
        } catch (error: any) {
          console.error('Network error during thumbnail upload:', error);
          throw new Error(`Network error during thumbnail upload: ${error.message}`);
        }

        if (!thumbnailUploadResponse.ok) {
          const errorData = await thumbnailUploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload thumbnail');
        }

        const { path: thumbnailBucketPath, url: thumbnailSignedUrl } = await thumbnailUploadResponse.json();

        updateUploadProgress(fileId, { status: 'thumbnail uploaded', progress: 60 });
        toast.success(`Uploaded thumbnail for ${file.name}!`);

        // Create initial DB record for thumbnail
        const createBody = JSON.stringify({
          path: thumbnailSignedUrl, // Store signed URL of thumbnail in 'path' column
          mime: file.type,
          thumbnailUrl: thumbnailSignedUrl, // Store signed URL of thumbnail in 'thumbnail_path' column
        });
        console.log('createThumbnailRequest Body:', createBody);

        let createThumbnailResponse;
        try {
          createThumbnailResponse = await fetch('/api/photos/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: createBody,
          });
        } catch (error: any) {
          console.error('Network error during create thumbnail record:', error);
          throw new Error(`Network error during create thumbnail record: ${error.message}`);
        }

        if (!createThumbnailResponse.ok) {
          const errorText = await createThumbnailResponse.text();
          try {
            const errorData = JSON.parse(errorText);
            console.error('Failed to create photo record for thumbnail:', errorData);
            throw new Error(errorData.error || `Failed to create photo record for thumbnail in database: ${errorText}`);
          } catch (jsonError) {
            console.error('Failed to create photo record for thumbnail (non-JSON response):', errorText);
            throw new Error(`Failed to create photo record for thumbnail: ${errorText}`);
          }
        }
        const createThumbnailResult = await createThumbnailResponse.json();
        console.log('Thumbnail record created:', createThumbnailResult);

        // Add temporary photo with thumbnail to store
        const tempPhoto: Photo = {
          id: createThumbnailResult.id,
          file,
          url: thumbnailSignedUrl, // Use thumbnail URL as a placeholder for full-res initially
          thumbnailUrl: thumbnailSignedUrl,
          name: file.name,
          size: file.size,
          type: file.type,
          metadata: {},
        };
        addPhotos([tempPhoto]); // Add immediately to trigger UI update (and invalidates cache)
        updateUploadProgress(fileId, { status: 'queued for full-res', progress: 70 });

        // Asynchronously process the full-resolution photo without awaiting it
        processFullResolutionPhoto(file, fileId, createThumbnailResult.id, thumbnailSignedUrl);

      } catch (error) {
        console.error('Error processing file:', error);
        updateUploadProgress(fileId, { 
          status: 'error', 
          progress: 0, 
          error: 'Failed to process file' 
        });
        toast.error(`Failed to process ${file.name}`);
      }
    });

    await concurrentQueue(uploadTasks, MAX_CONCURRENT_UPLOADS);

    setIsUploading(false);
  }, [addPhotos, setUploadProgress, updatePhoto, updateUploadProgress, processFullResolutionPhoto, fetchPhotos]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.tiff', '.bmp', '.JXL']
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isUploading
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 artsy-hover
          ${isDragActive && !isDragReject 
            ? 'border-prussian-blue bg-prussian-blue/20 scale-105 shadow-lg' 
            : isDragReject
            ? 'border-rose-ebony bg-rose-ebony/20'
            : 'border-rose-ebony hover:border-prussian-blue-400 hover:bg-cream-100'
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
              <Upload className="w-12 h-12 text-baby-powder" />
              <p className="text-h5 font-medium text-baby-powder">Drop photos here</p>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-navy-800 to-gray-800 rounded-2xl flex items-center justify-center shadow-lg">
                  <Image className="w-8 h-8 text-navy-300" />
                </div>
                {isUploading && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-prussian-blue-500 rounded-full flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-baby-powder border-t-transparent rounded-full"
                    />
                  </motion.div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-h3 font-semibold text-prussian-blue">
                  Upload Photos
                </h3>
                <p className="text-neutral-600 max-w-md">
                  Drag and drop, or click to browse. 
                </p>
              </div>
            
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
}
