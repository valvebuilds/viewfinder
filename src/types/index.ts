export interface Photo {
  id: string
  file: File
  url: string
  thumbnailUrl?: string
  name: string
  size: number
  type: string
  width?: number
  height?: number
  metadata?: {
    exif?: any
    colorPalette?: string[]
    dominantColor?: string
    brightness?: number
    contrast?: number
  }
  isSelected?: boolean
  order?: number
}

export interface Album {
  id: string
  name: string
  description?: string
  photos: Photo[]
  coverPhoto?: Photo
  createdAt: Date
  updatedAt: Date
  settings: AlbumSettings
  clientAccess?: ClientAccess
}

export interface AlbumSettings {
  curationAlgorithm: CurationAlgorithm
  maxPhotos?: number
  includeMetadata?: boolean
  customPrompt?: string
  layout: AlbumLayout
}

export type CurationAlgorithm = 
  | 'chronological'
  | 'color-story'
  | 'best-shots'
  | 'artistic-flow'
  | 'custom'

export type AlbumLayout = 
  | 'grid'
  | 'masonry'
  | 'timeline'
  | 'story'

export interface ClientAccess {
  id: string
  albumId: string
  accessToken: string
  expiresAt?: Date
  permissions: ClientPermissions
  feedback?: ClientFeedback[]
}

export interface ClientPermissions {
  canView: boolean
  canDownload: boolean
  canComment: boolean
  canSelect: boolean
}

export interface ClientFeedback {
  id: string
  photoId: string
  type: 'like' | 'dislike' | 'comment' | 'selection'
  content?: string
  createdAt: Date
  clientInfo?: {
    name?: string
    email?: string
  }
}

export interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

export interface AIAnalysisResult {
  photoId: string
  scores: {
    composition: number
    lighting: number
    color: number
    sharpness: number
    overall: number
  }
  tags: string[]
  suggestedOrder?: number
  colorPalette: string[]
  dominantColor: string
}

export interface AlbumGenerationOptions {
  algorithm: CurationAlgorithm
  maxPhotos: number
  customPrompt?: string
  includeMetadata: boolean
  targetAudience?: 'client' | 'portfolio' | 'social'
}

export interface DragItem {
  type: 'photo'
  photo: Photo
  index: number
}

export interface DropResult {
  dropEffect: 'move' | 'copy'
  photo: Photo
  targetIndex: number
}
