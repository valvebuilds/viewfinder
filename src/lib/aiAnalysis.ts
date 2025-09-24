// AI Analysis utilities for photo scoring and curation
// This is a mock implementation - in a real app, this would connect to AI services

export interface PhotoAnalysis {
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
  metadata: {
    brightness: number
    contrast: number
    saturation: number
    temperature: number
  }
}

export class AIAnalyzer {
  private static instance: AIAnalyzer

  static getInstance(): AIAnalyzer {
    if (!AIAnalyzer.instance) {
      AIAnalyzer.instance = new AIAnalyzer()
    }
    return AIAnalyzer.instance
  }

  // Mock AI analysis - in reality this would use computer vision APIs
  async analyzePhoto(photo: File): Promise<PhotoAnalysis> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Generate mock analysis data
    const photoId = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Mock scores (0-100)
    const composition = Math.floor(Math.random() * 40 + 60) // 60-100
    const lighting = Math.floor(Math.random() * 40 + 60)
    const color = Math.floor(Math.random() * 40 + 60)
    const sharpness = Math.floor(Math.random() * 40 + 60)
    const overall = Math.floor((composition + lighting + color + sharpness) / 4)

    // Mock tags based on scores
    const tags = this.generateTags(composition, lighting, color, sharpness)
    
    // Mock color palette
    const colorPalette = this.generateColorPalette()
    const dominantColor = colorPalette[0]

    return {
      photoId,
      scores: {
        composition,
        lighting,
        color,
        sharpness,
        overall
      },
      tags,
      colorPalette,
      dominantColor,
      metadata: {
        brightness: Math.floor(Math.random() * 100),
        contrast: Math.floor(Math.random() * 100),
        saturation: Math.floor(Math.random() * 100),
        temperature: Math.floor(Math.random() * 100)
      }
    }
  }

  // Analyze multiple photos for album curation
  async analyzePhotos(photos: File[]): Promise<PhotoAnalysis[]> {
    const analyses = await Promise.all(
      photos.map(photo => this.analyzePhoto(photo))
    )

    // Sort by overall score and assign suggested order
    analyses.sort((a, b) => b.scores.overall - a.scores.overall)
    analyses.forEach((analysis, index) => {
      analysis.suggestedOrder = index + 1
    })

    return analyses
  }

  // Generate album curation based on algorithm
  async curateAlbum(
    analyses: PhotoAnalysis[], 
    algorithm: 'best-shots' | 'chronological' | 'color-story' | 'artistic-flow',
    maxPhotos: number = 50
  ): Promise<PhotoAnalysis[]> {
    let curated: PhotoAnalysis[]

    switch (algorithm) {
      case 'best-shots':
        curated = analyses
          .sort((a, b) => b.scores.overall - a.scores.overall)
          .slice(0, maxPhotos)
        break

      case 'chronological':
        // In real implementation, this would use EXIF data
        curated = analyses
          .sort((a, b) => a.photoId.localeCompare(b.photoId))
          .slice(0, maxPhotos)
        break

      case 'color-story':
        curated = this.curateByColorStory(analyses, maxPhotos)
        break

      case 'artistic-flow':
        curated = this.curateByArtisticFlow(analyses, maxPhotos)
        break

      default:
        curated = analyses.slice(0, maxPhotos)
    }

    return curated
  }

  private generateTags(composition: number, lighting: number, color: number, sharpness: number): string[] {
    const tags: string[] = []

    if (composition > 80) tags.push('excellent composition')
    if (lighting > 80) tags.push('great lighting')
    if (color > 80) tags.push('vibrant colors')
    if (sharpness > 80) tags.push('sharp focus')

    // Add random contextual tags
    const contextualTags = [
      'portrait', 'landscape', 'close-up', 'wide shot', 'golden hour',
      'natural light', 'studio', 'outdoor', 'indoor', 'candid',
      'posed', 'action', 'still life', 'abstract', 'documentary'
    ]

    const randomTags = contextualTags
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 1)

    return [...tags, ...randomTags]
  }

  private generateColorPalette(): string[] {
    const palettes = [
      ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'], // Blue, Green, Orange, Red, Purple
      ['#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1'], // Orange, Yellow, Green, Cyan, Indigo
      ['#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'], // Pink, Rose, Orange, Yellow, Green
      ['#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'], // Purple gradient
      ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'], // Blue gradient
    ]

    return palettes[Math.floor(Math.random() * palettes.length)]
  }

  private curateByColorStory(analyses: PhotoAnalysis[], maxPhotos: number): PhotoAnalysis[] {
    // Group photos by dominant color families
    const colorGroups = new Map<string, PhotoAnalysis[]>()
    
    analyses.forEach(analysis => {
      const colorFamily = this.getColorFamily(analysis.dominantColor)
      if (!colorGroups.has(colorFamily)) {
        colorGroups.set(colorFamily, [])
      }
      colorGroups.get(colorFamily)!.push(analysis)
    })

    // Create a balanced selection from each color group
    const curated: PhotoAnalysis[] = []
    const photosPerGroup = Math.ceil(maxPhotos / colorGroups.size)

    for (const [colorFamily, photos] of colorGroups) {
      const sortedPhotos = photos.sort((a, b) => b.scores.overall - a.scores.overall)
      curated.push(...sortedPhotos.slice(0, photosPerGroup))
    }

    return curated.slice(0, maxPhotos)
  }

  private curateByArtisticFlow(analyses: PhotoAnalysis[], maxPhotos: number): PhotoAnalysis[] {
    // Create a narrative flow based on visual elements
    const sorted = analyses.sort((a, b) => b.scores.overall - a.scores.overall)
    
    // Start with strongest photos, then create visual rhythm
    const curated: PhotoAnalysis[] = []
    const strongPhotos = sorted.slice(0, Math.ceil(maxPhotos * 0.4))
    const supportingPhotos = sorted.slice(Math.ceil(maxPhotos * 0.4))

    // Alternate between strong and supporting photos for rhythm
    let strongIndex = 0
    let supportingIndex = 0

    for (let i = 0; i < maxPhotos && (strongIndex < strongPhotos.length || supportingIndex < supportingPhotos.length); i++) {
      if (i % 3 === 0 && strongIndex < strongPhotos.length) {
        curated.push(strongPhotos[strongIndex])
        strongIndex++
      } else if (supportingIndex < supportingPhotos.length) {
        curated.push(supportingPhotos[supportingIndex])
        supportingIndex++
      } else if (strongIndex < strongPhotos.length) {
        curated.push(strongPhotos[strongIndex])
        strongIndex++
      }
    }

    return curated
  }

  private getColorFamily(color: string): string {
    // Simple color family classification
    const colorMap: { [key: string]: string } = {
      '#3b82f6': 'blue',
      '#10b981': 'green', 
      '#f59e0b': 'orange',
      '#ef4444': 'red',
      '#8b5cf6': 'purple',
      '#f97316': 'orange',
      '#eab308': 'yellow',
      '#22c55e': 'green',
      '#06b6d4': 'cyan',
      '#6366f1': 'indigo',
      '#ec4899': 'pink',
      '#f43f5e': 'rose'
    }

    return colorMap[color] || 'neutral'
  }

  // Generate album title based on analysis
  generateAlbumTitle(analyses: PhotoAnalysis[]): string {
    const topTags = analyses
      .flatMap(a => a.tags)
      .reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      }, {} as { [key: string]: number })

    const mostCommonTag = Object.entries(topTags)
      .sort(([,a], [,b]) => b - a)[0]?.[0]

    const date = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    })

    if (mostCommonTag) {
      return `${mostCommonTag.charAt(0).toUpperCase() + mostCommonTag.slice(1)} Collection - ${date}`
    }

    return `Photo Album - ${date}`
  }

  // Generate album description
  generateAlbumDescription(analyses: PhotoAnalysis[]): string {
    const avgScore = analyses.reduce((sum, a) => sum + a.scores.overall, 0) / analyses.length
    const photoCount = analyses.length

    if (avgScore > 85) {
      return `A stunning collection of ${photoCount} carefully curated photographs showcasing exceptional composition, lighting, and artistic vision.`
    } else if (avgScore > 70) {
      return `A beautiful selection of ${photoCount} photographs that capture memorable moments with great attention to detail and visual appeal.`
    } else {
      return `A curated collection of ${photoCount} photographs that tell a compelling visual story.`
    }
  }
}

// Export singleton instance
export const aiAnalyzer = AIAnalyzer.getInstance()
